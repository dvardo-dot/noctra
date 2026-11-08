# NOCTRA
Código completo e independente do player. HTML, CSS e JavaScript nativo no modo NOCTRA, com Webamp 2.3.1 no modo Winamp. O YouTube é utilizado apenas para Join Me.

## Abrir no VS Code
1. Extraia o ZIP e abra esta pasta no VS Code.
2. No terminal, execute `npm start` (é necessário ter Node.js).
3. Abra http://127.0.0.1:5500 no navegador.

Não precisa executar npm install. Para parar o servidor, use Ctrl+C. Os módulos JavaScript precisam de um servidor HTTP; abrir index.html por duplo clique não é suficiente.

## Suas músicas
A coleção está em tracks.js:
- Nightcore - Join Me: YouTube FQK3z21Hy9Q.
- Nightcore - L’amour Toujours: audio/nightcore-lamour-toujours.mp3.
- Nightcore - 18 (English): audio/nightcore-18.mp3.

O pacote contém os dois MP3. Publicando esses arquivos, serão essas mesmas músicas, sem faixas demonstrativas. Aleatório apenas muda a ordem da coleção cadastrada. Join Me depende de internet e da disponibilidade de incorporação do vídeo no YouTube.

Para acrescentar uma música, copie o áudio para audio/ e adicione um objeto em tracks.js com id, title, artist, src, cover e duration (segundos). discArt é opcional; sem ele, o CD usa cover. Para um vídeo do YouTube, use youtubeId no lugar de src. A duração é atualizada pelo áudio real durante o carregamento.

O botão de adicionar arquivos pelo navegador vale apenas para a sessão; para disponibilizar as músicas no site publicado, cadastre os arquivos em tracks.js e envie a pasta audio/ junto.

## Repositório e publicação
Envie o conteúdo desta pasta ao seu repositório, incluindo audio/ e assets/. index.html já está na raiz. O projeto pode ser hospedado como site estático, sem build. server.cjs é apenas para desenvolvimento local. Nenhuma conta, chave, token ou configuração de hospedagem do Codex é necessária.

Não exclua os MP3 do repositório se quiser que sejam carregados pelo site hospedado. As URLs e caminhos são relativos para funcionar também em subpastas.

## Arquivos principais
- index.html: interface e mascotes SVG.
- style.css: visual retrô, layout responsivo e animações.
- app.js: seleção de faixas, controles e estado de reprodução.
- media.js: integração entre áudio nativo e YouTube.
- desktop.js: janelas, relógio e seleção de fundo.
- tracks.js: cadastro das músicas.
- assets/: capas e planos de fundo.
- audio/: arquivos MP3 enviados pelo usuário.

Miku e Giratina acompanham o estado real da reprodução. Movimento reduzido deixa as animações estáticas. A imagem de fundo escolhida em Aparência é salva por navegador e domínio; visitantes começam com o fundo padrão. Não há início automático de áudio.

## Modo Winamp · Angels Eyes
O atalho Winamp no desktop, na barra de tarefas e no menu do player abre Webamp 2.3.1 com a skin original Angels Eyes, versão 1.3, criada por Kevin Chok em 2001. O arquivo assets/Angels_Eyes.wsz foi preservado sem modificações (MD5 580ed76ffaa20948b39d6d9dca060655); contém o readme e os créditos originais. Fonte: https://skins.webamp.org/skin/580ed76ffaa20948b39d6d9dca060655

O Webamp é carregado sob demanda pela distribuição oficial versionada no jsDelivr (licença MIT). Fonte e documentação: https://github.com/captbaritone/webamp e https://docs.webamp.org

O modo Winamp usa os MP3 da coleção e o equalizador real de dez bandas do Webamp. Resetar equalizador retorna as dez bandas e o pré-amplificador a 0 dB e liga o equalizador, sem alterar o volume escolhido. O adaptador do reset usa as ações internas da versão fixada 2.3.1. Ao atualizar essa dependência, confira o reset.

Join Me continua no NOCTRA pelo YouTube. O áudio de um iframe do YouTube não é processado pelo equalizador do Webamp. O botão Ouvir Join Me no NOCTRA troca de modo e abre a faixa. A troca de player pausa o anterior; não há duas reproduções simultâneas nem início automático de áudio ao abrir o Winamp. Minimizar o Winamp mantém seu MP3 tocando; restaure pela barra de tarefas.

Para abrir diretamente esse modo, use ?player=winamp no endereço do site.

## Companheiros do desktop
desktop-pets.js reutiliza as ilustrações SVG de Miku e Giratina da interface. No modo de seguir, acompanham o mouse ou o último toque e não interceptam cliques. A opção em Aparência permite desligar esse comportamento e mostrar os personagens junto à minutagem. A preferência é salva no navegador. Com movimento reduzido, os companheiros ficam parados na parte inferior da tela. A animação é suspensa quando a página está oculta.

## Winamp integrado ao CD
O Winamp fica dentro da janela principal, logo abaixo do disco e dos controles, e abre sem iniciar áudio. Recolher esconde apenas o painel Winamp e mantém a música tocando; os atalhos Winamp o reabrem. Nos MP3 tocados pelo Winamp, o CD acompanha a capa, o título e o estado real do elemento de áudio, e os controles superiores comandam play/pausa, faixa, posição, volume, aleatório e repetição. O equalizador continua processando o áudio desse player. Join Me permanece no YouTube. A sincronização utiliza o elemento de áudio interno da versão fixa Webamp 2.3.1; confira essa integração se atualizar a biblioteca. A preferência de movimento reduzido continua respeitada.
