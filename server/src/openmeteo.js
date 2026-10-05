// Usado quando não tem chave da OpenWeather. O Open-Meteo é grátis e não pede chave.
// As respostas são convertidas pro mesmo formato da OpenWeather, assim o resto
// do servidor (transformar.js) funciona igual pros dois.
const { erro } = require('./openweather');

// códigos de tempo da OMM que o Open-Meteo usa -> [descrição, ícone da OpenWeather]
const CODIGOS = {
  0: ['céu limpo', '01'],
  1: ['poucas nuvens', '02'],
  2: ['parcialmente nublado', '03'],
  3: ['nublado', '04'],
  45: ['neblina', '50'],
  48: ['neblina', '50'],
  51: ['garoa fraca', '09'],
  53: ['garoa', '09'],
  55: ['garoa forte', '09'],
  56: ['garoa congelante', '09'],
  57: ['garoa congelante', '09'],
  61: ['chuva fraca', '10'],
  63: ['chuva moderada', '10'],
  65: ['chuva forte', '10'],
  66: ['chuva congelante', '13'],
  67: ['chuva congelante', '13'],
  71: ['neve fraca', '13'],
  73: ['neve', '13'],
  75: ['neve forte', '13'],
  77: ['neve', '13'],
  80: ['pancadas de chuva', '09'],
  81: ['pancadas de chuva', '09'],
  82: ['pancadas de chuva forte', '09'],
  85: ['pancadas de neve', '13'],
  86: ['pancadas de neve', '13'],
  95: ['trovoada', '11'],
  96: ['trovoada com granizo', '11'],
  99: ['trovoada com granizo', '11'],
};

const semAcento = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

function tempo(codigo, dia) {
  const [description, icone] = CODIGOS[codigo] || ['', '03'];
  return [{ description, icon: icone + (dia ? 'd' : 'n') }];
}

// o índice europeu vai de 0 a 100+, a OpenWeather usa de 1 a 5
function indiceAr(aqi) {
  if (aqi <= 20) return 1;
  if (aqi <= 40) return 2;
  if (aqi <= 60) return 3;
  if (aqi <= 80) return 4;
  return 5;
}

function criarClienteOpenMeteo(fetchFn = fetch) {
  async function get(url) {
    let res;
    try {
      res = await fetchFn(url, {
        signal: AbortSignal.timeout(8000),
        headers: { 'User-Agent': 'clima-agora (github.com/ViniciuscLemos/clima-agora)' },
      });
    } catch {
      throw erro(503, 'Não consegui buscar o clima agora. Tenta de novo daqui a pouco.');
    }
    if (!res.ok) throw erro(502, `O serviço de clima respondeu com erro ${res.status}.`);
    return res.json();
  }

  // agora() e previsao() usam a mesma chamada, então guardo por 1 minuto pra não buscar duas vezes
  const ultimas = new Map();
  function previsaoBruta(lat, lon) {
    const chave = `${lat},${lon}`;
    const salvo = ultimas.get(chave);
    if (salvo && salvo.expira > Date.now()) return salvo.promessa;

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
    const promessa = get(`https://api.open-meteo.com/v1/forecast?${params}`);
    promessa.catch(() => ultimas.delete(chave));
    ultimas.set(chave, { promessa, expira: Date.now() + 60 * 1000 });
    return promessa;
  }

  async function buscarNoNominatim(q) {
    const params = new URLSearchParams({ q, format: 'json', 'accept-language': 'pt', addressdetails: 1, limit: 1 });
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
    async cidades(q, limit = 5) {
      const params = new URLSearchParams({ name: q, count: 10, language: 'pt', format: 'json' });
      const dados = await get(`https://geocoding-api.open-meteo.com/v1/search?${params}`);

      // primeiro as que têm o nome digitado (às vezes vem cidade que só bate num nome alternativo),
      // depois as maiores, senão "Paris" vira Paris do Texas
      const temNome = (c) => (semAcento(c.name).includes(semAcento(q)) ? 1 : 0);
      const resultados = (dados.results || []).sort((a, b) =>
        temNome(b) - temNome(a) || (b.population || 0) - (a.population || 0));

      // o Open-Meteo só conhece o nome original ("Moscou" acha um vilarejo na Bélgica).
      // Na busca final (limit 1), se só achou lugar pequeno, tento no Nominatim, que entende português.
      // No autocompletar não dá pra usar o Nominatim, as regras deles não deixam.
      if (limit === 1 && !(resultados[0]?.population > 5000)) {
        const achado = await buscarNoNominatim(q).catch(() => null);
        if (achado) return [achado];
      }

      return resultados.slice(0, limit).map((c) => ({
        name: c.name,
        state: c.admin1,
        country: c.country_code,
        lat: c.latitude,
        lon: c.longitude,
      }));
    },

    async reverso(lat, lon) {
      const params = new URLSearchParams({ lat, lon, format: 'json', 'accept-language': 'pt', zoom: 10 });
      const dados = await get(`https://nominatim.openstreetmap.org/reverse?${params}`);
      const a = dados.address || {};
      const nome = a.city || a.town || a.village || a.municipality;
      if (!nome) return [];
      return [{ name: nome, state: a.state, country: (a.country_code || '').toUpperCase(), lat, lon }];
    },

    async agora(lat, lon) {
      const f = await previsaoBruta(lat, lon);
      const c = f.current;
      // visibilidade só vem por hora, pego a da hora atual
      const i = Math.max(0, f.hourly.time.findIndex((t) => t > c.time) - 1);

      return {
        weather: tempo(c.weather_code, c.is_day),
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

    async previsao(lat, lon) {
      const f = await previsaoBruta(lat, lon);
      const h = f.hourly;
      const agora = Date.now() / 1000;

      // a OpenWeather manda de 3 em 3 horas a partir da próxima hora, faço igual
      const list = [];
      for (let i = h.time.findIndex((t) => t >= agora); i >= 0 && i < h.time.length && list.length < 40; i += 3) {
        list.push({
          dt: h.time[i],
          main: {
            temp: h.temperature_2m[i],
            temp_min: h.temperature_2m[i],
            temp_max: h.temperature_2m[i],
            humidity: h.relative_humidity_2m[i],
          },
          weather: tempo(h.weather_code[i], h.is_day[i]),
          pop: (h.precipitation_probability[i] ?? 0) / 100,
        });
      }

      return { list, city: { timezone: f.utc_offset_seconds } };
    },

    async ar(lat, lon) {
      const params = new URLSearchParams({ latitude: lat, longitude: lon, current: 'european_aqi,pm10,pm2_5' });
      const dados = await get(`https://air-quality-api.open-meteo.com/v1/air-quality?${params}`);
      const c = dados.current;
      if (c?.european_aqi == null) return null;
      return { list: [{ main: { aqi: indiceAr(c.european_aqi) }, components: { pm2_5: c.pm2_5, pm10: c.pm10 } }] };
    },
  };
}

module.exports = { criarClienteOpenMeteo };
