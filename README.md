# Rosarium

Página estática para rezar o rosário em latim, com tradução em português. [Acesse o site](https://joaoguimaraens.github.io/rosarium/).

No celular, toque na oração em latim para mostrar ou ocultar a tradução. O botão de sol e lua salva a escolha do tema no navegador. Sem uma escolha salva, o site acompanha o tema do navegador.

## Rodar localmente

Na raiz do projeto:

```bash
python -m http.server 8000
```

Abra [http://localhost:8000](http://localhost:8000). As orações ficam em `rosarium.md`; a interface, em `index.html` e `assets/`.

## Verificar

Use Node.js 24.8+ e Python 3.9+:

```bash
node --check assets/js/content.js
node --check assets/js/app.js
node --check assets/js/theme.js
npx --yes html-validate@11.19.0 --preset standard --max-warnings 0 index.html
python scripts/check_site.py
```

O `npx` baixa o validador HTML. Os demais comandos usam apenas Node.js e Python. Confira também os temas e as traduções no navegador, conforme [AGENTS.md](AGENTS.md).

## Publicar

O [workflow](.github/workflows/pages.yml) verifica JavaScript, HTML e caminhos locais em pushes na `main` e em pull requests. Publica no GitHub Pages após os checks passarem na `main`. Também aceita execução manual pela aba Actions.

Em Settings / Pages / Build and deployment, selecione GitHub Actions como origem. A publicação usa o token automático do GitHub. O site funciona sem build, com fontes e bibliotecas locais.
