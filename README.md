# Joias em Ordem

Jogo HTML5 para o YouTube Playables, já integrado ao SDK oficial.
É um quebra-cabeça de organizar por cor: toque num pote para pegar a gema de cima e em outro para soltar. A fase termina quando cada pote tem uma cor só.

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe o jogo em http://localhost:5173 |
| `npm test` | Roda os testes das regras, do solver e do gerador de fases |
| `npm run check` | Confere a pasta `game/` contra os limites do YouTube |
| `npm run bundle` | Roda o check e gera `playable.zip` para envio |

Não há dependências para instalar. Precisa só do Node 22 ou mais novo.

## Como o jogo funciona

- **Fases infinitas:** a fase N é sempre a mesma e sempre tem solução, porque o gerador só aceita fases que o solver resolve.
- **Dificuldade:** começa com 2 cores e ganha uma cor a cada 3 fases, até 9.
- **Controles:** toque ou mouse. No teclado, os números escolhem o pote, `Z` desfaz, `R` reinicia, `H` pede dica e `Enter` avança.
- **Acessibilidade:** cada cor tem também um símbolo próprio.
- **Idiomas:** português e inglês, escolhidos pelo idioma do YouTube.

## Monetização

Os anúncios são os do próprio YouTube, pedidos pelo SDK. Não há anúncio nem compra de fora.

- **Anúncio com recompensa:** quando as dicas acabam, o botão de dica abre um cartão perguntando se o jogador quer ver um anúncio para ganhar 3 dicas. Só abre se ele tocar em "Ver anúncio".
- **Anúncio entre fases:** a partir da fase 3 e depois a cada 3 fases, na troca de tela depois da vitória.
- **Pré-roll:** o YouTube mostra sozinho no carregamento, sem código.

A frequência fica em `game/src/config.js`. A divisão de receita está em fase piloto e só vale para jogos aprovados, com a monetização ligada no portal do desenvolvedor. Fora do YouTube os anúncios não aparecem: o anúncio com recompensa é simulado como visto, para dar para testar o fluxo.

## Estrutura

```
game/               tudo que vai para o YouTube (só esta pasta entra no zip)
  index.html        carrega o SDK antes do jogo
  src/config.js     balanceamento, ritmo das animações e cores
  src/puzzle.js     regras (funções puras)
  src/solver.js     acha uma solução: valida fases e dá dicas
  src/levels.js     gerador de fases
  src/session.js    estado da partida e ações do jogador
  src/save.js       formato e validação do save
  src/platform.js   única camada que fala com o SDK (ytgame)
  src/audio.js      sons sintetizados, obedecem ao mudo do YouTube
  src/layout.js     posição de potes e botões em qualquer tela
  src/sprites.js    gemas
  src/jars.js       potes de vidro
  src/background.js fundo
  src/effects.js    partículas
  src/ui.js         placar, botões e cartões
  src/scene.js      monta cada quadro
  src/main.js       ponto de entrada
tests/              testes
tools/              servidor local, verificador e gerador do zip
```

## Regras do YouTube já atendidas

- SDK carregado antes do código do jogo.
- `firstFrameReady` na tela de carregamento e `gameReady` só com o jogo jogável.
- Save pela nuvem com `loadData` antes de qualquer `saveData`, e save validado.
- Áudio respeita `isAudioEnabled` e `onAudioEnabledChange`, sem botão de mudo próprio.
- Pausa e retomada só por `onPause` e `onResume`, sem Page Visibility API.
- Caminhos relativos, nomes de arquivo válidos e pacote de poucas dezenas de KiB.
- Anúncio com recompensa só por escolha do jogador, e anúncio entre telas só em pausa natural.

## Limites que o `check` confere

| Item | Obrigatório | Recomendado |
|---|---|---|
| Carregamento inicial | menos de 30 MiB | menos de 15 MiB |
| Pacote total | menos de 250 MiB | |
| Cada arquivo | menos de 30 MiB | menos de 512 KiB |
| Quantidade de arquivos | até 8.000 | |

O `check` não mede save, tempo de carregamento nem memória. Esses são conferidos na ferramenta do YouTube.

## Testar a integração de verdade

Fora do YouTube o SDK não faz nada, então o jogo local usa `localStorage` no lugar do save na nuvem.
Para validar a integração, rode `npm run dev` e abra o jogo na ferramenta oficial:

- Test Suite: https://developers.google.com/youtube/gaming/playables/test_suite
- Guia: https://developers.google.com/youtube/gaming/playables/reference/test_suite_guide

## Segundo jogo: Guardiões da Fusão

Fica na pasta `guardioes/` e usa as mesmas ferramentas. É um jogo de fusão com defesa de torre: invoque magos, arraste um sobre outro igual para fundir num mais forte e segure as ondas de monstros antes que cheguem ao castelo.

| Comando | O que faz |
|---|---|
| `npm run dev:guardioes` | Sobe o jogo em http://localhost:5174 |
| `npm run check:guardioes` | Confere a pasta contra os limites do YouTube |
| `npm run bundle:guardioes` | Gera `playable-guardioes.zip` |

- **Regras e balanceamento:** `guardioes/src/sim.js` e `guardioes/src/config.js`. Um teste joga partidas inteiras com um jogador automático para garantir que a dificuldade faz sentido.
- **Monetização:** ao perder, o jogador pode ver um anúncio para continuar da mesma onda, uma vez por partida, ou jogar de novo sem anúncio. Há anúncio entre partidas a cada 2 derrotas.
- **Recorde:** a maior onda vencida fica no save da nuvem e é enviada como pontuação.

## Capas

As capas de cada jogo ficam em `covers/`, em formato retrato e paisagem.

## Cadastro

O acesso é por aprovação. O formulário pede um jogo já jogável e de sua autoria:

https://docs.google.com/forms/d/e/1FAIpQLSdvdQ0lgIq2369aemj1O6w8R8FwGn9O5ARRGODDDUbVINCRJQ/viewform

Documentação: https://developers.google.com/youtube/gaming/playables
