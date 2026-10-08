# Clima Agora

![Testes](https://github.com/ViniciuscLemos/clima-agora/actions/workflows/testes.yml/badge.svg)

App de previsão do tempo feito em React + Node. Você digita uma cidade (ou usa sua localização) e ele mostra o clima de agora, as próximas horas, os próximos 5 dias e a qualidade do ar.

![Clima Agora mostrando o tempo no Rio de Janeiro](docs/print.png)

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

Já funciona sem configurar nada: sem chave da OpenWeather, o servidor usa o [Open-Meteo](https://open-meteo.com/), que é grátis e não pede chave (e o Nominatim do OpenStreetMap pra achar o nome da cidade pela localização). Converti as respostas dele pro mesmo formato da OpenWeather, então o resto do código é igual pros dois.

Pra usar a OpenWeather:

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

- busca com sugestões enquanto digita (dá pra escolher com as setas e Enter)
- botão de usar a localização do navegador
- °C ou °F (fica salvo)
- últimas cidades pesquisadas
- horários sempre no fuso da cidade (se pesquisar Tóquio, o pôr do sol aparece no horário de lá)
- o fundo muda se tá sol, nublado, chovendo ou de noite
- modo escuro, que segue o tema do sistema

No modo escuro:

![Clima Agora no modo escuro](docs/print-escuro.png)

No celular fica assim:

<img src="docs/print-celular.png" alt="Clima Agora no celular" width="300">
