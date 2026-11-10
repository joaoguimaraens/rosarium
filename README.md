Reze o rosário em latim.

## Uso local

Sirva a raiz por HTTP:

```bash
python -m http.server 8000
```

Abra [http://localhost:8000](http://localhost:8000). Não há dependências nem build; Node.js é usado apenas nas verificações.

As orações ficam em `rosarium.md`; a estrutura, o estilo e o comportamento ficam em `index.html` e `assets/`. Preserve as seis seções e os 28 pares de orações.

## Acesso offline

Após a primeira visita terminar de salvar os arquivos, o site funciona sem internet no mesmo endereço. É necessário HTTPS ou `localhost`; limpar os dados do site remove a cópia offline.

O service worker nativo está em `sw.js` e é registrado por `assets/js/offline.js`. Mantenha a lista `FILES` atualizada ao adicionar, remover ou renomear recursos. Alterar arquivos já listados não exige mudar uma versão do cache. Atualizações aparecem em acessos posteriores; a página aberta não é recarregada.

## Verificações

Requer Node.js 24.8+ e Python 3.9+:

```bash
node --check assets/js/content.js
node --check assets/js/app.js
node --check assets/js/theme.js
node --check assets/js/offline.js
node --check sw.js
node --test scripts/*.test.cjs
npx --yes html-validate@11.19.0 --preset standard --max-warnings 0 index.html
python scripts/check_site.py
git diff --check
```

## Publicação

O [workflow](.github/workflows/pages.yml) valida pushes na `main` e PRs; só a `main` publica após os checks. Configure GitHub Pages para usar GitHub Actions. O workflow copia `index.html`, `rosarium.md`, `rosary.svg`, `sw.js` e `assets/` para publicação, sem build.
