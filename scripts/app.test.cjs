const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { test } = require("node:test");
const { runInNewContext } = require("node:vm");

const source = readFileSync(resolve(__dirname, "../assets/js/app.js"), "utf8");
const settle = () => new Promise(resolve => setImmediate(resolve));

function node() {
  return {
    attributes: {}, events: {}, hidden: true,
    setAttribute(name, value) { this.attributes[name] = value; },
    removeAttribute(name) { delete this.attributes[name]; },
    addEventListener(type, callback) { this.events[type] = callback; },
    replaceChildren(...children) { this.children = children; },
    focus(options) { this.focusOptions = options; },
    scrollIntoView() { this.scrolled = true; }
  };
}

async function app({ mobile = true, fail = false } = {}) {
  const content = node();
  const navigation = node();
  const links = node();
  const retry = node();
  const section = node();
  const summary = node();
  const prayer = { open: false, querySelector: () => summary };
  const link = { ...node(), hash: "#oracoes-iniciais" };
  const media = { ...node(), matches: mobile };
  const document = {
    ...node(),
    getElementById: id => ({ content, "section-links": links, retry, "oracoes-iniciais": section })[id],
    querySelector: () => navigation
  };
  const window = { ...node(), location: { hash: link.hash }, matchMedia: () => media };
  content.querySelectorAll = () => content.children ? [prayer] : [];
  links.querySelectorAll = () => links.children ? [link] : [];
  summary.parentElement = prayer;
  summary.closest = () => summary;
  const requests = [];
  const errors = [];
  const result = { content: {}, links: {} };
  const state = { fail };
  runInNewContext(source, {
    document, window,
    RosariumContent: { render: () => result },
    console: { error: (...args) => errors.push(args) },
    fetch: async (url, options) => {
      requests.push({ url, cache: options.cache });
      return { ok: !state.fail, status: state.fail ? 503 : 200, text: async () => "markdown" };
    }
  });
  await settle();
  return { content, navigation, links, retry, section, summary, prayer, link, media, state, requests, errors, result };
}

test("carrega as orações, atualiza a navegação e mantém o foco inicial", async () => {
  const page = await app();
  assert.deepEqual(page.requests, [{ url: "rosarium.md", cache: "default" }]);
  assert.deepEqual(page.content.children, [page.result.content]);
  assert.deepEqual(page.links.children, [page.result.links]);
  assert.equal(page.navigation.hidden, false);
  assert.equal(page.content.attributes["aria-busy"], "false");
  assert.equal(page.link.attributes["aria-current"], "location");
  assert.equal(page.section.scrolled, true);
  assert.equal(page.content.focusOptions, undefined);
  assert.equal(page.errors.length, 0);
});

test("preserva as traduções abertas no celular ao alternar o layout", async () => {
  const page = await app();
  assert.equal(page.prayer.open, false);
  page.content.events.click({ target: page.summary });
  page.prayer.open = true; // The native details control toggles after the click handler.
  page.media.matches = false;
  page.media.events.change();
  assert.equal(page.prayer.open, true);
  assert.equal(page.summary.tabIndex, -1);
  assert.equal(page.summary.attributes["aria-disabled"], "true");
  let prevented = false;
  page.content.events.click({ target: page.summary, preventDefault: () => { prevented = true; } });
  assert.equal(prevented, true);
  page.media.matches = true;
  page.media.events.change();
  assert.equal(page.prayer.open, true);
  assert.equal(page.summary.attributes["aria-disabled"], undefined);
  page.content.events.click({ target: page.summary });
  page.prayer.open = false;
  page.media.matches = false;
  page.media.events.change();
  page.media.matches = true;
  page.media.events.change();
  assert.equal(page.prayer.open, false);
});

test("exibe a falha e recupera com rede preferida e foco no conteúdo", async () => {
  const page = await app({ fail: true });
  assert.equal(page.navigation.hidden, true);
  assert.match(page.content.innerHTML, /role="alert"/);
  assert.equal(page.content.attributes["aria-busy"], "false");
  assert.equal(page.errors.length, 1);
  page.state.fail = false;
  await page.retry.events.click();
  assert.deepEqual(page.requests[1], { url: "rosarium.md", cache: "no-cache" });
  assert.equal(page.navigation.hidden, false);
  assert.equal(page.content.attributes["aria-busy"], "false");
  assert.equal(page.content.focusOptions.preventScroll, true);
});
