const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { criarApp } = require('./app');
const { criarCliente } = require('./openweather');
const { criarClienteOpenMeteo } = require('./openmeteo');

const chave = process.env.OPENWEATHER_API_KEY;
const PORT = process.env.PORT || 3001;

// com chave usa a OpenWeather, sem chave usa o Open-Meteo (que é grátis e não pede chave)
const cliente = chave ? criarCliente(chave) : criarClienteOpenMeteo();
const fonte = chave ? 'openweather' : 'open-meteo';

if (!chave) {
  console.log('Sem OPENWEATHER_API_KEY no server/.env, usando o Open-Meteo.');
}

const app = criarApp(cliente, { fonte });

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
