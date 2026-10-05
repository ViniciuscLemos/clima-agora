const BASE = 'https://api.openweathermap.org';

function erro(status, mensagem) {
  const e = new Error(mensagem);
  e.status = status;
  return e;
}

function criarCliente(chave, fetchFn = fetch) {
  async function get(caminho, params) {
    const url = new URL(caminho, BASE);
    url.search = new URLSearchParams({ ...params, appid: chave });

    let res;
    try {
      res = await fetchFn(url, { signal: AbortSignal.timeout(8000) });
    } catch {
      throw erro(503, 'Não consegui falar com a OpenWeather. Tenta de novo daqui a pouco.');
    }

    if (res.status === 401) {
      throw erro(502, 'Chave da OpenWeather inválida (se você acabou de criar, ela demora umas 2h pra funcionar).');
    }
    if (res.status === 429) {
      throw erro(503, 'Muitas consultas na OpenWeather, espera um minuto.');
    }
    if (!res.ok) {
      throw erro(502, `A OpenWeather respondeu com erro ${res.status}.`);
    }
    return res.json();
  }

  return {
    cidades: (q, limit = 5) => get('/geo/1.0/direct', { q, limit }),
    reverso: (lat, lon) => get('/geo/1.0/reverse', { lat, lon, limit: 1 }),
    agora: (lat, lon) => get('/data/2.5/weather', { lat, lon, units: 'metric', lang: 'pt_br' }),
    previsao: (lat, lon) => get('/data/2.5/forecast', { lat, lon, units: 'metric', lang: 'pt_br' }),
    ar: (lat, lon) => get('/data/2.5/air_pollution', { lat, lon }),
  };
}

module.exports = { criarCliente, erro };
