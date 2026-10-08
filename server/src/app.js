const express = require('express');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');

const { erro } = require('./openweather');
const { formatarCidade, montarResposta } = require('./transformar');

const DEZ_MINUTOS = 10 * 60 * 1000;
const PASTA_WEB = path.join(__dirname, '..', '..', 'web', 'dist');

function criarApp(cliente, { fonte = 'openweather' } = {}) {
  const app = express();
  app.set('trust proxy', 1); // pro rate limit pegar o IP certo no Render

  // cache por coordenada (2 casas decimais dá mais ou menos 1 km)
  const cache = new Map();

  async function buscarClima(lat, lon) {
    const chave = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    const salvo = cache.get(chave);
    if (salvo && salvo.expira > Date.now()) return salvo.dados;

    const [atual, previsao, ar] = await Promise.all([
      cliente.agora(lat, lon),
      cliente.previsao(lat, lon),
      cliente.ar(lat, lon).catch(() => null), // se a qualidade do ar falhar, mostra o resto
    ]);

    const dados = { atual, previsao, ar };
    cache.set(chave, { dados, expira: Date.now() + DEZ_MINUTOS });
    return dados;
  }

  app.use('/api', rateLimit({ windowMs: 60 * 1000, limit: 60 }));

  app.get('/api/cidades', async (req, res, next) => {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) return res.json([]);
    try {
      const cidades = (await cliente.cidades(q)).map(formatarCidade);
      // as APIs às vezes devolvem a mesma cidade duas vezes com coordenadas um pouco diferentes
      const vistas = new Set();
      res.json(cidades.filter((c) => {
        const chave = `${c.nome}|${c.estado}|${c.pais}`;
        if (vistas.has(chave)) return false;
        vistas.add(chave);
        return true;
      }));
    } catch (e) {
      next(e);
    }
  });

  // /api/clima?cidade=Recife  ou  /api/clima?lat=-8.05&lon=-34.88
  app.get('/api/clima', async (req, res, next) => {
    try {
      let local;

      if (req.query.cidade) {
        const nome = String(req.query.cidade).trim();
        const [cidade] = await cliente.cidades(nome, 1);
        if (!cidade) throw erro(404, `Não achei nenhuma cidade chamada "${nome}".`);
        local = formatarCidade(cidade);
      } else if (req.query.lat && req.query.lon) {
        const lat = Number(req.query.lat);
        const lon = Number(req.query.lon);
        if (isNaN(lat) || isNaN(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
          throw erro(400, 'Latitude ou longitude inválida.');
        }

        if (req.query.nome) {
          // quando vem do autocompletar o nome já vem junto
          local = { nome: req.query.nome, estado: req.query.estado || null, pais: req.query.pais || null, lat, lon };
        } else {
          const [achado] = await cliente.reverso(lat, lon).catch(() => []);
          local = achado ? { ...formatarCidade(achado), lat, lon } : { nome: 'Sua localização', estado: null, pais: null, lat, lon };
        }
      } else {
        throw erro(400, 'Faltou a cidade (?cidade=) ou as coordenadas (?lat=&lon=).');
      }

      const { atual, previsao, ar } = await buscarClima(local.lat, local.lon);
      res.json(montarResposta({ local, atual, previsao, ar, fonte }));
    } catch (e) {
      next(e);
    }
  });

  // em produção o servidor entrega o front buildado também
  if (fs.existsSync(PASTA_WEB)) {
    app.use(express.static(PASTA_WEB));
    app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(PASTA_WEB, 'index.html')));
  }

  // eslint-disable-next-line no-unused-vars
  app.use((e, req, res, next) => {
    if (!e.status) console.error(e);
    res.status(e.status || 500).json({ erro: e.status ? e.message : 'Deu algum erro no servidor.' });
  });

  return app;
}

module.exports = { criarApp };
