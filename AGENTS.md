# Rosarium

Página estática para rezar o rosário em latim e português. Priorize a leitura no celular e uma interface discreta.

## Arquitetura

- `index.html`: estrutura; `rosarium.md`: conteúdo bilíngue; `assets/css/style.css`: apresentação.
- `assets/js/content.js` renderiza o Markdown; `app.js` carrega as orações e controla as traduções; `theme.js` controla o tema e o favicon; `offline.js` registra `sw.js`, que salva os arquivos para acesso offline.
- `assets/fonts/source-serif-4/` e `assets/vendor/`: fonte e bibliotecas locais, com licenças. Não edite arquivos de terceiros manualmente.
- `rosary.svg`: máscara do cabeçalho e favicon automático; `assets/icons/`: favicons claro/escuro derivados dele e ícones SVG locais. Sol/lua: Lucide, licença em `assets/vendor/lucide/LICENSE`.
- Preserve o preload dos SVGs e dos dois favicons em `index.html`; máscaras usam `crossorigin` para coincidir com o modo da requisição CSS.
- `.github/workflows/pages.yml`: CI e publicação; `scripts/check_site.py`: validação dos caminhos locais na raiz.

## Regras

- Mantenha HTML, CSS, JavaScript e conteúdo separados. O site deve funcionar diretamente da raiz por HTTP, sem framework, backend, npm ou build. Não adicione `package.json` nem geração obrigatória de arquivos. Node.js é usado apenas nos checks.
- Só altere orações mediante pedido explícito. Preserve acentos, ordem e correspondência nas tabelas, com latim à esquerda e português à direita.
- Use caminhos relativos e arquivos locais; preserve as licenças das fontes e bibliotecas.
- Mantenha o título seguido da citação: “Rezem o Rosário todos os dias.” — Santíssima Virgem Maria.
- Salve a escolha manual do tema em `localStorage` e restaure-a entre visitas. Sem escolha válida salva, acompanhe o tema do navegador. Se o armazenamento estiver indisponível, mantenha a troca funcional durante a visita. Favicon e rosário do cabeçalho acompanham o tema.
- Até 767 px em orientação vertical, mostre latim primeiro; toque ou teclado alternam apenas sua tradução logo abaixo. Sem labels de tradução nesse modo. Na horizontal, em qualquer largura, e a partir de 768 px, os idiomas ficam visíveis lado a lado.
- Use controles nativos acessíveis, foco visível, alvos de toque confortáveis e tamanhos de texto legíveis. Com `prefers-reduced-motion`, mantenha o fade de cores e suprima apenas o deslocamento do seletor; não zere a duração global. Preserve o foco no conteúdo após uma nova tentativa bem-sucedida.
- Passe ao Marked somente o Markdown versionado; conteúdo externo exige sanitização.
- Preserve Source Serif 4, a paleta azul e espaçamentos compactos. Não inclua o link “Voltar ao início” no final da página.
- Mantenha a documentação curta; atualize o README se mudar comandos ou publicação.

## Offline

- Use as APIs nativas do navegador em `sw.js`, sem Workbox ou outras dependências. Mantenha `FILES` ao adicionar, remover ou renomear recursos; edições usuais não exigem mudar uma versão do cache.
- Preserve a resposta imediata do cache e a revalidação em segundo plano com `waitUntil`; somente respostas bem-sucedidas substituem a cópia salva. Requisições concorrentes não podem fazer uma resposta antiga sobrescrever a mais recente. Nova tentativa e recargas explícitas preferem a rede, com alternativa offline.
- Restrinja o cache aos arquivos listados, com caminhos relativos e isolamento pelo escopo. Preserve `/` e `index.html`, parâmetros do favicon e hospedagem em subdiretório. Não force recarga, ativação ou controle sobre abas em uso: `clients.claim()` faz o Firefox recarregar máscaras SVG. Na primeira visita, aguarde `navigator.serviceWorker.ready` para verificar a instalação; as próximas navegações serão controladas.

## Verificação

Execute os comandos do [README](README.md) e `git diff --check`. Não há testes automatizados de navegador. Faça verificações proporcionais à mudança:

- Confira 320/390/768/1280 px, também com texto a 200%, temas, favicon, teclado, toque, redimensionamento, movimento reduzido e ausência de rolagem horizontal.
- Nas transições, teste a preferência real do sistema sem emulação, além de `reduce` e `no-preference`; emular apenas animações habilitadas pode ocultar falhas.
- Preserve as seis seções e os 28 pares de orações/mistérios; confira navegação, fragmentos e hospedagem em subdiretório.
- Para mudanças no carregamento, teste falha e nova tentativa. Relate somente verificações executadas.
- Para mudanças offline, teste primeira instalação, reabertura sem rede, atualização em segundo plano e falhas sem perda da cópia salva. O cache pode ocultar edições locais; use as ferramentas do navegador para ignorar o worker ao conferir a versão da rede.

## Publicação

O CI valida pushes na `main` e PRs; só a `main` publica após validação. Envie apenas `index.html`, `rosarium.md`, `rosary.svg`, `sw.js` e `assets/`. `_site/` é só uma cópia temporária para publicação, sem build. Fixe actions por SHA e restrinja as permissões de publicação ao job de deploy, dependente dos checks.
