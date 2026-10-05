const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { criarApp } = require('./app');
const { criarCliente } = require('./openweather');
const { criarClienteDemo } = require('./demo');

const chave = process.env.OPENWEATHER_API_KEY;
const PORT = process.env.PORT || 3001;

if (!chave) {
  console.log('Sem OPENWEATHER_API_KEY no server/.env, usando os dados de exemplo.');
}

const cliente = chave ? criarCliente(chave) : criarClienteDemo();
const app = criarApp(cliente, { demo: !chave });

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
