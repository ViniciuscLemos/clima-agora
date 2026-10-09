const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const f = require('./fixtures');
const { criarApp } = require('../src/app');

// cliente falso no lugar da OpenWeather, contando as chamadas
function clienteFalso(extra = {}) {
  const chamadas = { cidades: 0, agora: 0 };
  const cliente = {
    cidades: async (q) => {
      chamadas.cidades++;
      return q.toLowerCase().includes('paulo') ? f.geocoding : [];
    },
    reverso: async () => f.geocoding,
    agora: async () => {
      chamadas.agora++;
      return f.atual;
    },
    previsao: async () => f.previsao,
    ar: async () => f.ar,
    ...extra,
  };
  return { cliente, chamadas };
}

describe('GET /api/clima', () => {
  it('busca pelo nome da cidade', async () => {
    const { cliente } = clienteFalso();
    const res = await request(criarApp(cliente)).get('/api/clima?cidade=São Paulo');

    assert.equal(res.status, 200);
    assert.equal(res.body.local.nome, 'São Paulo');
    assert.equal(res.body.atual.descricao, 'Nublado');
    assert.equal(res.body.dias.length, 5);
    assert.equal(res.body.horas.length, 8);
    assert.equal(res.body.qualidade_ar.rotulo, 'Razoável');
  });

  it('não chama a API de novo pra mesma cidade (cache)', async () => {
    const { cliente, chamadas } = clienteFalso();
    const app = criarApp(cliente);
    await request(app).get('/api/clima?cidade=São Paulo');
    await request(app).get('/api/clima?cidade=São Paulo');
    assert.equal(chamadas.agora, 1);
  });

  it('cidade que não existe dá 404', async () => {
    const { cliente } = clienteFalso();
    const res = await request(criarApp(cliente)).get('/api/clima?cidade=Xyzópolis');
    assert.equal(res.status, 404);
    assert.match(res.body.erro, /Xyzópolis/);
  });

  it('sem cidade nem coordenada dá 400', async () => {
    const { cliente } = clienteFalso();
    const app = criarApp(cliente);
    assert.equal((await request(app).get('/api/clima')).status, 400);
    assert.equal((await request(app).get('/api/clima?lat=abc&lon=1')).status, 400);
  });

  it('busca por coordenada e usa o nome que veio junto', async () => {
    const { cliente } = clienteFalso();
    const res = await request(criarApp(cliente)).get('/api/clima?lat=-8.05&lon=-34.88&nome=Recife&pais=BR');
    assert.equal(res.status, 200);
    assert.equal(res.body.local.nome, 'Recife');
  });

  it('funciona mesmo se a qualidade do ar falhar', async () => {
    const { cliente } = clienteFalso({ ar: async () => { throw new Error('fora do ar'); } });
    const res = await request(criarApp(cliente)).get('/api/clima?cidade=São Paulo');
    assert.equal(res.status, 200);
    assert.equal(res.body.qualidade_ar, null);
  });
});

describe('GET /api/saude', () => {
  it('responde ok sem chamar a API do tempo', async () => {
    const { cliente, chamadas } = clienteFalso();
    const res = await request(criarApp(cliente)).get('/api/saude');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { ok: true });
    assert.equal(chamadas.agora, 0);
  });
});

describe('GET /api/cidades', () => {
  it('devolve as sugestões', async () => {
    const { cliente } = clienteFalso();
    const res = await request(criarApp(cliente)).get('/api/cidades?q=sao paulo');
    assert.equal(res.body[0].nome, 'São Paulo');
  });

  it('não repete a mesma cidade', async () => {
    const repetida = { name: 'Curitiba', state: 'Rio de Janeiro', country: 'BR', lat: -22.1, lon: -43.2 };
    const { cliente } = clienteFalso({
      cidades: async () => [repetida, { ...repetida, lat: -22.2 }, { ...repetida, state: 'Paraná' }],
    });
    const res = await request(criarApp(cliente)).get('/api/cidades?q=curitiba');
    assert.deepEqual(res.body.map((c) => c.estado), ['Rio de Janeiro', 'Paraná']);
  });

  it('com menos de 2 letras nem chama a API', async () => {
    const { cliente, chamadas } = clienteFalso();
    const res = await request(criarApp(cliente)).get('/api/cidades?q=s');
    assert.deepEqual(res.body, []);
    assert.equal(chamadas.cidades, 0);
  });
});
