const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { test } = require("node:test");
const { runInNewContext } = require("node:vm");
const marked = require("../assets/vendor/marked/marked.min.js");

const root = resolve(__dirname, "..");
const read = path => readFileSync(resolve(root, path), "utf8");
const source = read("rosarium.md").replace(/\r\n?/g, "\n");
const { parse } = runInNewContext(`${read("assets/js/content.js")}; RosariumContent`, { marked });
const tables = marked.lexer(source).filter(token => token.type === "table");

function replaceTable(index, replacement) {
  return source.replace(tables[index].raw, replacement);
}

test("preserva as seis seções, seus fragmentos e os 28 pares em ordem", () => {
  const sections = parse(source);
  assert.deepEqual(Array.from(sections, section => [section.id, section.prayers.length]), [
    ["oracoes-iniciais", 7],
    ["misterios-gozosos", 5],
    ["misterios-dolorosos", 5],
    ["misterios-gloriosos", 5],
    ["misterios-luminosos", 5],
    ["oracoes-finais", 1]
  ]);
  assert.match(sections[0].prayers[0].latin, /^In nómine Pátris/);
  assert.match(sections[0].prayers[0].portuguese, /^Em nome do Pai/);
  assert.equal(sections[1].weekdays[1], "Segunda-feira e sábado");
  assert.match(sections[1].prayers[0].latin, /<strong>Prímum Mystérium Gaudiósum:<\/strong>/);
  assert.match(sections[1].prayers[0].portuguese, /<br><em>Pai Nosso<\/em>/);
});

test("alterar títulos preserva os fragmentos e os ícones públicos", () => {
  const renamed = source.replace("Orações Iniciais", "Orações de abertura");
  const section = parse(renamed)[0];
  assert.equal(section.title, "Orações de abertura");
  assert.equal(section.id, "oracoes-iniciais");
  assert.equal(section.icon, "initial");
});

test("rejeita seções ausentes, extras ou vazias", () => {
  assert.throws(() => parse(replaceTable(5, "")), /seis seções/);
  assert.throws(() => parse(`${source}\n\n${tables[5].raw}`), /seis seções/);
  for (const index of [0, 1, 5]) {
    const empty = tables[index].raw.split("\n").slice(0, 2).join("\n") + "\n\n";
    assert.throws(() => parse(replaceTable(index, empty)), /não contém orações/);
  }
});

test("rejeita tradução ausente e colunas extras que o Marked descartaria", () => {
  const row = tables[0].raw.split("\n")[3];
  const latin = row.split("|")[1].trim();
  assert.throws(() => parse(source.replace(row, `| ${latin} | |`)), /dois idiomas|latim e português/);
  assert.throws(() => parse(source.replace(row, `${row} terceira coluna |`)), /latim e português/);
});

test("permite barras escapadas dentro das duas colunas", () => {
  const changed = source.replace("Em nome do Pai", "Em nome do Pai \\| teste");
  assert.match(parse(changed)[0].prayers[0].portuguese, /Pai \| teste/);
});

test("rejeita nomes sem texto, inclusive antes de outro nome", () => {
  const orphan = "| *Nome* | *Nome* |\n";
  assert.throws(() => parse(replaceTable(5, `${tables[5].raw.trimEnd()}\n${orphan}\n`)), /Nome de oração sem texto/);
  const firstName = tables[0].raw.split("\n")[2];
  assert.throws(() => parse(source.replace(firstName, `${firstName}\n${firstName}`)), /Nome de oração sem texto/);
});

test("rejeita mistérios sem dias e quantidades incorretas de orações", () => {
  const weekdays = tables[1].raw.split("\n")[2];
  assert.throws(() => parse(source.replace(`${weekdays}\n`, "")), /indicar os dias/);
  const prayer = tables[1].raw.split("\n")[3];
  assert.throws(() => parse(source.replace(`${prayer}\n`, "")), /Quantidade de orações inválida/);
});

test("rejeita títulos duplicados", () => {
  const duplicate = source.replace("Mistérios Dolorosos", "Mistérios Gozosos");
  assert.throws(() => parse(duplicate), /devem ser únicos/);
});

test("os subconjuntos das fontes cobrem os caracteres dos arquivos exibidos", () => {
  const available = new Set(read("assets/fonts/source-serif-4/characters.txt"));
  for (const path of ["rosarium.md", "index.html", "assets/js/content.js", "assets/js/app.js", "assets/js/theme.js"]) {
    const missing = [...new Set(read(path))].filter(character => !/\s/.test(character) && !available.has(character));
    assert.deepEqual(missing, [], `${path}: caracteres ausentes no subconjunto da fonte`);
  }
});
