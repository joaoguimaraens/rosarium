# Rosarium

Página estática para rezar o rosário em latim e português. Priorize a leitura no celular e uma interface discreta.

## Arquitetura

- `index.html`: estrutura; `rosarium.md`: conteúdo bilíngue; `assets/css/style.css`: apresentação.
- `assets/js/content.js` renderiza o Markdown; `app.js` carrega as orações e controla as traduções; `theme.js` controla o tema e o favicon.
- `assets/fonts/source-serif-4/` e `assets/vendor/`: fonte e bibliotecas locais, com licenças. Não edite arquivos de terceiros manualmente.
- `rosary.svg`: máscara do cabeçalho e favicon automático; `assets/icons/`: favicons claro/escuro derivados dele. Sol/lua: SVGs Lucide no HTML, licença em `assets/vendor/lucide/LICENSE`.
- `.github/workflows/pages.yml`: CI e publicação; `scripts/check_site.py`: validação dos caminhos locais.

## Regras

- Mantenha HTML, CSS, JavaScript e conteúdo separados. Sem framework, backend ou build; sirva por HTTP por causa do `fetch`.
- Só altere orações mediante pedido explícito. Preserve acentos, ordem e correspondência nas tabelas, com latim à esquerda e português à direita.
- Use caminhos relativos e arquivos locais; preserve as licenças das fontes e bibliotecas.
- Mantenha o título seguido da citação: “Rezem o Rosário todos os dias.” — Santíssima Virgem Maria.
- Salve a escolha manual do tema em `localStorage` e restaure-a entre visitas. Sem escolha válida salva, acompanhe o tema do navegador. Se o armazenamento estiver indisponível, mantenha a troca funcional durante a visita. Favicon e rosário do cabeçalho acompanham o tema.
- Até 767 px, mostre latim primeiro; toque ou teclado alternam apenas sua tradução logo abaixo. Sem labels de tradução. A partir de 768 px, os idiomas ficam visíveis lado a lado.
- Use controles nativos acessíveis, foco visível, alvos de toque confortáveis e tamanhos de texto legíveis.
- Passe ao Marked somente o Markdown versionado; conteúdo externo exige sanitização.
- Preserve Source Serif 4, a paleta azul, espaçamentos compactos e o rodapé apenas com o link para o início.
- Mantenha a documentação curta; atualize o README se mudar comandos ou publicação.

## Verificação

Execute os comandos do [README](README.md) e `git diff --check`. Não há testes automatizados de navegador. Faça verificações proporcionais à mudança:

- Confira 320/390/768/1280 px, temas, favicon, teclado, toque, redimensionamento e ausência de rolagem horizontal.
- Preserve as seis seções e os 28 pares de orações/mistérios; confira navegação, fragmentos e hospedagem em subdiretório.
- Para mudanças no carregamento, teste falha e nova tentativa. Relate somente verificações executadas.

## Publicação

O CI valida pushes na `main` e PRs; só a `main` publica após validação. Envie apenas `index.html`, `rosarium.md`, `rosary.svg` e `assets/`. Fixe actions por SHA e restrinja as permissões de publicação ao job de deploy, dependente dos checks.
