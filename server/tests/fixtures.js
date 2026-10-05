// respostas de exemplo no formato da OpenWeather
// 2024-06-01 12:00 UTC = 09:00 em São Paulo
const INICIO = Date.UTC(2024, 5, 1, 12) / 1000;
const FUSO_SP = -10800;

const geocoding = [
  {
    name: 'Sao Paulo',
    local_names: { pt: 'São Paulo', en: 'São Paulo' },
    lat: -23.5506507,
    lon: -46.6333824,
    country: 'BR',
    state: 'São Paulo',
  },
];

const atual = {
  coord: { lon: -46.6334, lat: -23.5507 },
  weather: [{ id: 803, main: 'Clouds', description: 'nublado', icon: '04d' }],
  main: { temp: 18.44, feels_like: 18.12, temp_min: 17.2, temp_max: 19.81, pressure: 1018, humidity: 72 },
  visibility: 10000,
  wind: { speed: 3.6, deg: 140, gust: 5.1 },
  clouds: { all: 75 },
  dt: INICIO,
  sys: { country: 'BR', sunrise: INICIO - 2 * 3600, sunset: INICIO + 8 * 3600 },
  timezone: FUSO_SP,
  name: 'São Paulo',
  cod: 200,
};

const previsao = {
  cod: '200',
  list: Array.from({ length: 40 }, (_, i) => {
    const dt = INICIO + i * 3 * 3600;
    const horaLocal = new Date((dt + FUSO_SP) * 1000).getUTCHours();
    return {
      dt,
      main: { temp: 15 + (horaLocal >= 9 && horaLocal <= 15 ? 8 : 0) + i * 0.1, temp_min: 14 + i * 0.1, temp_max: 24 + i * 0.1, humidity: 60 + (i % 3) * 10 },
      weather: [{ id: 500, main: 'Rain', description: 'chuva leve', icon: horaLocal >= 6 && horaLocal < 18 ? '10d' : '10n' }],
      wind: { speed: 2, deg: 90 },
      pop: (i % 5) / 10,
    };
  }),
  city: { name: 'São Paulo', country: 'BR', timezone: FUSO_SP },
};

const ar = {
  list: [{ main: { aqi: 2 }, components: { pm2_5: 12.345, pm10: 20.11 } }],
};

module.exports = { INICIO, FUSO_SP, geocoding, atual, previsao, ar };
