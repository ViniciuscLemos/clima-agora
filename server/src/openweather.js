const BASE = 'https://api.openweathermap.org';

function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

function createClient(key, fetchFn = fetch) {
  async function get(route, params) {
    const url = new URL(route, BASE);
    url.search = new URLSearchParams({ ...params, appid: key });

    let res;
    try {
      res = await fetchFn(url, { signal: AbortSignal.timeout(8000) });
    } catch {
      throw httpError(503, "Couldn't reach OpenWeather. Try again in a bit.");
    }

    if (res.status === 401) {
      throw httpError(502, 'Invalid OpenWeather key (if you just created it, it takes about 2h to start working).');
    }
    if (res.status === 429) {
      throw httpError(503, 'Too many requests to OpenWeather, wait a minute.');
    }
    if (!res.ok) {
      throw httpError(502, `OpenWeather answered with error ${res.status}.`);
    }
    return res.json();
  }

  return {
    cities: (q, limit = 5) => get('/geo/1.0/direct', { q, limit }),
    reverse: (lat, lon) => get('/geo/1.0/reverse', { lat, lon, limit: 1 }),
    current: (lat, lon) => get('/data/2.5/weather', { lat, lon, units: 'metric', lang: 'en' }),
    forecast: (lat, lon) => get('/data/2.5/forecast', { lat, lon, units: 'metric', lang: 'en' }),
    air: (lat, lon) => get('/data/2.5/air_pollution', { lat, lon }),
  };
}

module.exports = { createClient, httpError };
