Reze o rosário em latim.

## Local

```bash
python -m http.server 8000
```

Abra [http://localhost:8000](http://localhost:8000).

As orações ficam em `rosarium.md`; a interface, em `index.html` e `assets/`.

As seis tabelas mantêm a ordem atual, latim à esquerda e português à direita. Linhas com ambos os campos em itálico nomeiam a oração seguinte; nos quatro grupos de mistérios, a primeira indica os dias. São 28 pares. Os fragmentos e ícones são fixados em `content.js`, independentemente dos títulos.

## Verificação

Use Node.js 24.8+ e Python 3.9+:

```bash
node --check assets/js/content.js
node --check assets/js/app.js
node --check assets/js/theme.js
node --test scripts/content.test.cjs
npx --yes html-validate@11.19.0 --preset standard --max-warnings 0 index.html
python scripts/check_site.py
```

Temas e traduções conforme [AGENTS.md](AGENTS.md).

Os testes usam apenas Node.js e o Marked local. Conferem o conteúdo e a cobertura dos caracteres pelos subconjuntos das fontes; ao acrescentar caracteres, atualize também as [fontes](assets/fonts/source-serif-4/README.md). As cores usam `light-dark()`, disponível nos navegadores atuais desde maio de 2024.

## Publicação

O [workflow](.github/workflows/pages.yml) verifica JavaScript, HTML, conteúdo, fontes e caminhos locais em pushes na `main` e em pull requests. Alterações apenas em arquivos `.md` não acionam o workflow, exceto `rosarium.md`, que contém as orações do site. Publica no GitHub Pages após os checks passarem na `main`. Também aceita execução manual pela aba Actions.

Em Settings / Pages / Build and deployment, selecione GitHub Actions como origem. A publicação usa o token automático do GitHub. O site funciona sem build, com fontes e bibliotecas locais.

O carregamento de `rosarium.md` respeita o cache HTTP da hospedagem; respostas ainda válidas podem ser reutilizadas entre visitas. O botão de nova tentativa força a revalidação.
