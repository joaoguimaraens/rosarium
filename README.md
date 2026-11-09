# Rosarium

Reze o rosário em latim, com tradução em português e uma interface simples, mobile-first.

## Local

```bash
python -m http.server 8000
```

Abra [http://localhost:8000](http://localhost:8000).

As orações ficam em `rosarium.md`; a interface, em `index.html` e `assets/`.

## Verificação

Use Node.js 24.8+ e Python 3.9+:

```bash
node --check assets/js/content.js
node --check assets/js/app.js
node --check assets/js/theme.js
npx --yes html-validate@11.19.0 --preset standard --max-warnings 0 index.html
python scripts/check_site.py
```

Temas e traduções conforme [AGENTS.md](AGENTS.md).

## Publicação

O [workflow](.github/workflows/pages.yml) verifica JavaScript, HTML e caminhos locais em pushes na `main` e em pull requests. Publica no GitHub Pages após os checks passarem na `main`. Também aceita execução manual pela aba Actions.

Em Settings / Pages / Build and deployment, selecione GitHub Actions como origem. A publicação usa o token automático do GitHub. O site funciona sem build, com fontes e bibliotecas locais.
