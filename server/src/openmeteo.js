// Used when there's no OpenWeather key. Open-Meteo is free and doesn't need a key.
// The responses are converted to the same format as OpenWeather, so the rest
// of the server (transform.js) works the same for both.
const { httpError } = require('./openweather');

// WMO weather codes used by Open-Meteo -> [description, OpenWeather icon]
const CODES = {
  0: ['clear sky', '01'],
  1: ['few clouds', '02'],
  2: ['partly cloudy', '03'],
  3: ['overcast', '04'],
  45: ['fog', '50'],
  48: ['fog', '50'],
  51: ['light drizzle', '09'],
  53: ['drizzle', '09'],
  55: ['heavy drizzle', '09'],
  56: ['freezing drizzle', '09'],
  57: ['freezing drizzle', '09'],
  61: ['light rain', '10'],
  63: ['moderate rain', '10'],
  65: ['heavy rain', '10'],
  66: ['freezing rain', '13'],
  67: ['freezing rain', '13'],
  71: ['light snow', '13'],
  73: ['snow', '13'],
  75: ['heavy snow', '13'],
  77: ['snow', '13'],
  80: ['rain showers', '09'],
  81: ['rain showers', '09'],
  82: ['heavy rain showers', '09'],
  85: ['snow showers', '13'],
  86: ['snow showers', '13'],
  95: ['thunderstorm', '11'],
  96: ['thunderstorm with hail', '11'],
  99: ['thunderstorm with hail', '11'],
};

const noAccents = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

function weatherFor(code, isDay) {
  const [description, icon] = CODES[code] || ['', '03'];
  return [{ description, icon: icon + (isDay ? 'd' : 'n') }];
}

// the European index goes from 0 to 100+, OpenWeather uses 1 to 5
function airIndex(aqi) {
  if (aqi <= 20) return 1;
  if (aqi <= 40) return 2;
  if (aqi <= 60) return 3;
  if (aqi <= 80) return 4;
  return 5;
}

function createOpenMeteoClient(fetchFn = fetch) {
  async function get(url) {
    let res;
    try {
      res = await fetchFn(url, {
        signal: AbortSignal.timeout(8000),
        headers: { 'User-Agent': 'weather-now (github.com/ViniciuscLemos/weather-now)' },
      });
    } catch {
      throw httpError(503, "Couldn't get the weather right now. Try again in a bit.");
    }
    if (!res.ok) throw httpError(502, `The weather service answered with error ${res.status}.`);
    return res.json();
  }

  // current() and forecast() use the same call, so I keep it for 1 minute to avoid fetching twice
  const recent = new Map();
  function rawForecast(lat, lon) {
    const key = `${lat},${lon}`;
    const saved = recent.get(key);
    if (saved && saved.expires > Date.now()) return saved.promise;

    const params = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,pressure_msl,wind_speed_10m,wind_direction_10m',
      hourly: 'temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,is_day,visibility',
      daily: 'temperature_2m_max,temperature_2m_min,sunrise,sunset',
      timezone: 'auto',
      forecast_days: 6,
      timeformat: 'unixtime',
      wind_speed_unit: 'ms',
    });
    const promise = get(`https://api.open-meteo.com/v1/forecast?${params}`);
    promise.catch(() => recent.delete(key));
    recent.set(key, { promise, expires: Date.now() + 60 * 1000 });
    return promise;
  }

  async function searchNominatim(q) {
    const params = new URLSearchParams({ q, format: 'json', 'accept-language': 'en', addressdetails: 1, limit: 1 });
    const [r] = await get(`https://nominatim.openstreetmap.org/search?${params}`);
    if (!r) return null;
    return {
      name: r.name,
      state: r.address?.state,
      country: (r.address?.country_code || '').toUpperCase(),
      lat: Number(r.lat),
      lon: Number(r.lon),
    };
  }

  return {
    async cities(q, limit = 5) {
      const params = new URLSearchParams({ name: q, count: 10, language: 'en', format: 'json' });
      const data = await get(`https://geocoding-api.open-meteo.com/v1/search?${params}`);

      // first the ones that have the typed name (sometimes a city only matches an alternate name),
      // then the biggest ones, otherwise "Paris" becomes Paris, Texas
      const hasName = (c) => (noAccents(c.name).includes(noAccents(q)) ? 1 : 0);
      const results = (data.results || []).sort((a, b) =>
        hasName(b) - hasName(a) || (b.population || 0) - (a.population || 0));

      // Open-Meteo only knows the original name ("Moscou" finds a village in Belgium).
      // On the final search (limit 1), if it only found a small place, I try Nominatim, which knows other languages.
      // Nominatim can't be used for autocomplete, their usage rules don't allow it.
      if (limit === 1 && !(results[0]?.population > 5000)) {
        const found = await searchNominatim(q).catch(() => null);
        if (found) return [found];
      }

      return results.slice(0, limit).map((c) => ({
        name: c.name,
        state: c.admin1,
        country: c.country_code,
        lat: c.latitude,
        lon: c.longitude,
      }));
    },

    async reverse(lat, lon) {
      const params = new URLSearchParams({ lat, lon, format: 'json', 'accept-language': 'en', zoom: 10 });
      const data = await get(`https://nominatim.openstreetmap.org/reverse?${params}`);
      const a = data.address || {};
      const name = a.city || a.town || a.village || a.municipality;
      if (!name) return [];
      return [{ name, state: a.state, country: (a.country_code || '').toUpperCase(), lat, lon }];
    },

    async current(lat, lon) {
      const f = await rawForecast(lat, lon);
      const c = f.current;
      // visibility only comes hourly, so I take the current hour's
      const i = Math.max(0, f.hourly.time.findIndex((t) => t > c.time) - 1);

      return {
        weather: weatherFor(c.weather_code, c.is_day),
        main: {
          temp: c.temperature_2m,
          feels_like: c.apparent_temperature,
          temp_min: f.daily.temperature_2m_min[0],
          temp_max: f.daily.temperature_2m_max[0],
          pressure: Math.round(c.pressure_msl),
          humidity: c.relative_humidity_2m,
        },
        wind: { speed: c.wind_speed_10m, deg: c.wind_direction_10m },
        visibility: f.hourly.visibility[i],
        dt: c.time,
        sys: { sunrise: f.daily.sunrise[0], sunset: f.daily.sunset[0] },
        timezone: f.utc_offset_seconds,
      };
    },

    async forecast(lat, lon) {
      const f = await rawForecast(lat, lon);
      const h = f.hourly;
      const now = Date.now() / 1000;

      // OpenWeather sends every 3 hours starting from the next hour, I do the same
      const list = [];
      for (let i = h.time.findIndex((t) => t >= now); i >= 0 && i < h.time.length && list.length < 40; i += 3) {
        list.push({
          dt: h.time[i],
          main: {
            temp: h.temperature_2m[i],
            temp_min: h.temperature_2m[i],
            temp_max: h.temperature_2m[i],
            humidity: h.relative_humidity_2m[i],
          },
          weather: weatherFor(h.weather_code[i], h.is_day[i]),
          pop: (h.precipitation_probability[i] ?? 0) / 100,
        });
      }

      return { list, city: { timezone: f.utc_offset_seconds } };
    },

    async air(lat, lon) {
      const params = new URLSearchParams({ latitude: lat, longitude: lon, current: 'european_aqi,pm10,pm2_5' });
      const data = await get(`https://air-quality-api.open-meteo.com/v1/air-quality?${params}`);
      const c = data.current;
      if (c?.european_aqi == null) return null;
      return { list: [{ main: { aqi: airIndex(c.european_aqi) }, components: { pm2_5: c.pm2_5, pm10: c.pm10 } }] };
    },
  };
}

module.exports = { createOpenMeteoClient };
