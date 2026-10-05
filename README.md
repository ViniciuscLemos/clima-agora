# Clima Agora

App de previsão do tempo feito em React + Node. Você digita uma cidade (ou usa sua localização) e ele mostra o clima de agora, as próximas horas, os próximos 5 dias e a qualidade do ar.

Os dados vêm da API da [OpenWeather](https://openweathermap.org/api). Fiz principalmente pra praticar React consumindo uma API de verdade.

## Por que tem um servidor

A OpenWeather precisa de uma chave, e se eu chamasse a API direto do React a chave ia ficar visível pra qualquer um no navegador. Então o front chama o meu servidor (Express), e ele chama a OpenWeather.

Já que ia ter servidor mesmo, aproveitei pra:
- juntar as 3 chamadas (tempo atual, previsão e qualidade do ar) numa só
- guardar as respostas por 10 minutos, pra não gastar o limite do plano grátis
- limitar as requisições por IP com o `express-rate-limit`

## Rodando

Precisa do Node 20+.

```bash
git clone https://github.com/ViniciuscLemos/clima-agora
cd clima-agora
npm install
npm run dev
```

Abre em http://localhost:5173.

Sem chave ele usa uma resposta de exemplo que salvei em `server/src/exemplo.json`, então dá pra ver a tela funcionando mesmo assim. Pra usar o clima de verdade:

1. cria uma conta grátis na [OpenWeather](https://home.openweathermap.org/users/sign_up) e copia sua chave
2. copia o `server/.env.example` pra `server/.env` e cola a chave lá

A chave nova pode demorar umas 2 horas pra começar a funcionar.

Pra produção:

```bash
npm run build
npm start
```

Aí o próprio servidor entrega o site em http://localhost:3001.

## Testes

```bash
npm test
```

## O que tem

- busca com sugestões enquanto digita
- botão de usar a localização do navegador
- °C ou °F (fica salvo)
- últimas cidades pesquisadas
- horários sempre no fuso da cidade (se pesquisar Tóquio, o pôr do sol aparece no horário de lá)
- o fundo muda se tá sol, nublado, chovendo ou de noite
