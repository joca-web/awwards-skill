# Rota Azul — demo

Site de demonstração feito com a awwards-skill. A marca **Rota Azul é fictícia**.

- O scroll controla o tempo de um vídeo (janela do avião → nuvens → baía), com altitude em tempo real.
- Design system Apple via `tokens.css` (`--ds-*`), sem bibliotecas de terceiros.
- Versão sem JavaScript ou com movimento reduzido: três cenas estáticas, legíveis de cima a baixo.
- Verificado em navegador real (Chromium) em 1440, 768 e 390 px com roda do mouse, sem erros de console nem rolagem horizontal.

Para rodar localmente: sirva esta pasta com qualquer servidor estático que aceite `Range` (o vídeo precisa disso para o scrub).
