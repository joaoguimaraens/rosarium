const assert = require("node:assert/strict");
const { readFileSync, readdirSync } = require("node:fs");
const { resolve } = require("node:path");
const { test } = require("node:test");
const { runInNewContext } = require("node:vm");

const root = resolve(__dirname, "..");
const source = readFileSync(resolve(root, "sw.js"), "utf8");

function worker(scope = "https://example.test/rosarium/") {
  const events = {};
  const entries = new Map();
  const stores = new Map([[`rosarium:${scope}`, entries]]);
  let network = async () => new Response("saved");
  let beforePut = async () => {};
  let blocked = false;
  let claimed = false;
  const key = request => typeof request === "string" ? request : request.url;
  const caches = {
    open: async name => {
      if (blocked) throw new Error("storage blocked");
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return {
        addAll: async requests => {
          const downloads = await Promise.all(requests.map(async request => {
            const response = await network(request);
            if (!response.ok) throw new Error("download failed");
            return [request.url, response];
          }));
          for (const [url, response] of downloads) store.set(url, response);
        },
        keys: async () => [...store.keys()].map(url => new Request(url)),
        delete: async request => store.delete(key(request)),
        put: async (request, response) => {
          await beforePut();
          store.set(key(request), response);
        },
        match: async request => store.get(key(request))?.clone()
      };
    }
  };
  runInNewContext(source, {
    self: {
      registration: { scope },
      clients: { claim: async () => { claimed = true; } },
      addEventListener: (type, callback) => { events[type] = callback; }
    },
    caches, Request, Response, URL,
    fetch: (...args) => network(...args)
  });
  return {
    entries, stores,
    get claimed() { return claimed; },
    set network(value) { network = value; },
    set beforePut(value) { beforePut = value; },
    set blocked(value) { blocked = value; },
    lifecycle(type) {
      let pending;
      events[type]({ waitUntil: promise => { pending = promise; } });
      return pending;
    },
    request(path, options) {
      let response;
      const tasks = [];
      events.fetch({
        request: new Request(new URL(path, scope), options),
        waitUntil: promise => tasks.push(promise),
        respondWith: promise => { response = promise; }
      });
      return { response, background: Promise.all(tasks) };
    }
  };
}

test("salva todos os recursos na raiz e em subdiretório; todos abrem sem rede", async () => {
  for (const scope of ["https://example.test/", "https://example.test/rosarium/"]) {
    const sw = worker(scope);
    await sw.lifecycle("install");
    const required = ["index.html", "rosarium.md", "rosary.svg"];
    for (const directory of ["assets/css", "assets/js", "assets/icons", "assets/fonts/source-serif-4", "assets/vendor/marked"]) {
      for (const name of readdirSync(resolve(root, directory))) {
        if (/\.(css|js|svg|woff2)$/.test(name)) required.push(`${directory}/${name}`);
      }
    }
    assert.deepEqual([...sw.entries.keys()].sort(), required.map(path => new URL(path, scope).href).sort());
    sw.network = async () => { throw new Error("offline"); };
    for (const path of [...required, "./?origem=atalho", "rosary.svg?v=3"]) {
      const request = sw.request(path);
      assert.equal(await (await request.response).text(), "saved");
      await request.background;
    }
    for (const path of required) assert.ok(readFileSync(resolve(root, path)).length);
  }
});

test("responde sem esperar a rede e atualiza a próxima leitura em segundo plano", { timeout: 2000 }, async () => {
  const sw = worker();
  await sw.lifecycle("install");
  let finish;
  sw.network = async (request, options) => {
    assert.equal(options.cache, "no-cache");
    return new Promise(resolve => { finish = resolve; });
  };
  const first = sw.request("rosarium.md");
  assert.equal(await (await first.response).text(), "saved");
  finish(new Response("updated"));
  await first.background;
  sw.network = async () => { throw new Error("offline"); };
  const next = sw.request("rosarium.md");
  assert.equal(await (await next.response).text(), "updated");
  await next.background;
});

test("erros HTTP e de rede não substituem a cópia salva", async () => {
  const sw = worker();
  await sw.lifecycle("install");
  for (const failure of [async () => new Response("error", { status: 503 }), async () => { throw new Error("offline"); }]) {
    sw.network = failure;
    const request = sw.request("rosarium.md");
    assert.equal(await (await request.response).text(), "saved");
    await request.background;
    assert.equal(await sw.entries.get("https://example.test/rosarium/rosarium.md").clone().text(), "saved");
  }
});

test("resposta antiga atrasada não sobrescreve uma nova tentativa", async () => {
  const sw = worker();
  await sw.lifecycle("install");
  let finishOld;
  sw.network = () => new Promise(resolve => { finishOld = resolve; });
  const old = sw.request("rosarium.md");
  assert.equal(await (await old.response).text(), "saved");

  sw.network = async () => new Response("newer");
  const retry = sw.request("rosarium.md", { cache: "no-cache" });
  assert.equal(await (await retry.response).text(), "newer");
  await retry.background;
  finishOld(new Response("older"));
  await old.background;
  assert.equal(await sw.entries.get("https://example.test/rosarium/rosarium.md").clone().text(), "newer");
});

test("gravação antiga em andamento termina antes da gravação mais recente", async () => {
  const sw = worker();
  await sw.lifecycle("install");
  let release;
  let started;
  const gate = new Promise(resolve => { release = resolve; });
  const writing = new Promise(resolve => { started = resolve; });
  let writes = 0;
  sw.beforePut = async () => {
    if (++writes === 1) {
      started();
      await gate;
    }
  };
  sw.network = async () => new Response("older");
  const old = sw.request("rosarium.md");
  await writing;
  sw.network = async () => new Response("newer");
  const retry = sw.request("rosarium.md", { cache: "no-cache" });
  await new Promise(resolve => setImmediate(resolve));
  release();
  await Promise.all([old.background, retry.background]);
  assert.equal(await (await retry.response).text(), "newer");
  assert.equal(await sw.entries.get("https://example.test/rosarium/rosarium.md").clone().text(), "newer");
});

test("falha de gravação não impede uma atualização posterior", async () => {
  const sw = worker();
  await sw.lifecycle("install");
  sw.beforePut = async () => { throw new Error("quota exceeded"); };
  sw.network = async () => new Response("not stored");
  await sw.request("rosarium.md").background;
  assert.equal(await sw.entries.get("https://example.test/rosarium/rosarium.md").clone().text(), "saved");

  sw.beforePut = async () => {};
  sw.network = async () => new Response("updated");
  const retry = sw.request("rosarium.md", { cache: "no-cache" });
  assert.equal(await (await retry.response).text(), "updated");
  await retry.background;
  assert.equal(await sw.entries.get("https://example.test/rosarium/rosarium.md").clone().text(), "updated");
});

test("nova tentativa e recargas preferem a rede, com alternativa offline", async () => {
  const sw = worker();
  await sw.lifecycle("install");
  for (const cache of ["no-cache", "reload"]) {
    sw.network = async () => new Response(cache);
    const request = sw.request("rosarium.md", { cache });
    assert.equal(await (await request.response).text(), cache);
    await request.background;
  }
  sw.network = async () => { throw new Error("offline"); };
  const request = sw.request("rosarium.md", { cache: "no-cache" });
  assert.equal(await (await request.response).text(), "reload");
  await request.background;
});

test("instalação incompleta falha; nova tentativa recupera o carregamento", async () => {
  const sw = worker();
  sw.network = async () => new Response("error", { status: 503 });
  await assert.rejects(sw.lifecycle("install"), /download failed/);
  assert.equal(sw.entries.size, 0);
  const failed = sw.request("rosarium.md");
  assert.equal((await failed.response).status, 503);
  await failed.background;
  sw.network = async () => new Response("recovered");
  await sw.lifecycle("install");
  assert.equal(await (await sw.request("rosarium.md").response).text(), "recovered");
});

test("limpa só o próprio cache, sem assumir páginas abertas ou interceptar URLs alheias", async () => {
  const sw = worker();
  await sw.lifecycle("install");
  const count = sw.entries.size;
  sw.entries.set("https://example.test/rosarium/removed.svg", new Response("old"));
  sw.stores.set("another-site", new Map());
  await sw.lifecycle("activate");
  assert.equal(sw.entries.size, count);
  assert.equal(sw.stores.size, 2);
  assert.equal(sw.claimed, false);
  for (const path of ["../", "missing.html", "https://other.test/rosarium.md"]) {
    assert.equal(sw.request(path).response, undefined);
  }
  assert.equal(sw.request("rosarium.md", { method: "POST" }).response, undefined);
});

test("armazenamento indisponível não interrompe a visita online", async () => {
  const sw = worker();
  sw.blocked = true;
  const request = sw.request("index.html");
  assert.equal(await (await request.response).text(), "saved");
  await request.background;
});
