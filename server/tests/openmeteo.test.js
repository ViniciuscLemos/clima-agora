const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { criarClienteOpenMeteo } = require('../src/openmeteo');
const { montarResposta } = require('../src/transformar');

// monta uma resposta parecida com a do Open-Meteo, começando 1h atrás
function respostaFalsa() {
  const inicio = Math.floor(Date.now() / 3600000) * 3600 - 3600;
  const horas = Array.from({ length: 144 }, (_, i) => inicio + i * 3600);
  return {
    utc_offset_seconds: -10800,
    current: {
      time: inicio + 3600, temperature_2m: 29.3, relative_humidity_2m: 58, apparent_temperature: 33.1,
      is_day: 1, weather_code: 61, pressure_msl: 1015.9, wind_speed_10m: 4.2, wind_direction_10m: 114,
    },
    hourly: {
      time: horas,
      temperature_2m: horas.map((_, i) => 20 + (i % 10)),
      relative_humidity_2m: horas.map(() => 70),
      precipitation_probability: horas.map((_, i) => i % 100),
      weather_code: horas.map(() => 3),
      is_day: horas.map(() => 1),
      visibility: horas.map(() => 24000),
    },
    daily: {
      temperature_2m_min: [22, 21, 20, 20, 21, 22],
      temperature_2m_max: [31, 30, 29, 30, 31, 32],
      sunrise: [inicio, 0, 0, 0, 0, 0],
      sunset: [inicio + 12 * 3600, 0, 0, 0, 0, 0],
    },
  };
}

function fetchFalso(url) {
  const u = String(url);
  let corpo;
  if (u.includes('geocoding')) {
    corpo = { results: [{ name: 'Recife', admin1: 'Pernambuco', country_code: 'BR', latitude: -8.05, longitude: -34.88 }] };
  } else if (u.includes('air-quality')) {
    corpo = { current: { european_aqi: 41, pm10: 28.6, pm2_5: 17.3 } };
  } else {
    corpo = respostaFalsa();
  }
  return Promise.resolve({ ok: true, status: 200, json: async () => corpo });
}

describe('Open-Meteo', () => {
  it('converte as cidades pro formato da OpenWeather', async () => {
    const cliente = criarClienteOpenMeteo(fetchFalso);
    const [c] = await cliente.cidades('recife');
    assert.deepEqual(c, { name: 'Recife', state: 'Pernambuco', country: 'BR', lat: -8.05, lon: -34.88 });
  });

  it('a resposta final sai igual à da OpenWeather', async () => {
    const cliente = criarClienteOpenMeteo(fetchFalso);
    const [atual, previsao, ar] = await Promise.all([cliente.agora(-8, -34), cliente.previsao(-8, -34), cliente.ar(-8, -34)]);
    const r = montarResposta({ local: { nome: 'Recife' }, atual, previsao, ar, fonte: 'open-meteo' });

    assert.equal(r.atual.temperatura, 29.3);
    assert.equal(r.atual.descricao, 'Chuva fraca');
    assert.equal(r.atual.icone, '10d');
    assert.equal(r.atual.vento_kmh, 15);
    assert.equal(r.atual.visibilidade_km, 24);
    assert.equal(r.local.fuso_segundos, -10800);
    assert.equal(r.horas.length, 8);
    assert.ok(r.horas[0].horario >= Date.now() / 1000 - 3600);
    assert.equal(r.dias.length, 5);
    assert.equal(r.qualidade_ar.rotulo, 'Moderada'); // índice europeu 41
  });

  it('cidade maior vem primeiro', async () => {
    const paris = [
      { name: 'Paris', admin1: 'Texas', country_code: 'US', latitude: 33.6, longitude: -95.5, population: 24782 },
      { name: 'Paris', admin1: 'Ilha de França', country_code: 'FR', latitude: 48.85, longitude: 2.35, population: 2138551 },
    ];
    const cliente = criarClienteOpenMeteo(async () => ({ ok: true, status: 200, json: async () => ({ results: paris }) }));
    const [c] = await cliente.cidades('paris', 1);
    assert.equal(c.country, 'FR');
  });

  it('cidade que não existe volta lista vazia', async () => {
    const cliente = criarClienteOpenMeteo(async () => ({ ok: true, status: 200, json: async () => ({}) }));
    assert.deepEqual(await cliente.cidades('xyzópolis'), []);
  });
});
