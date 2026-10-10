// Builds the API answers the e2e tests serve, from the same fake OpenWeather data the
// server tests use, through the real server code. Run it again when the API shape changes:
//   node e2e/fixtures/make.cjs
const fs = require('fs');
const path = require('path');
const request = require('supertest');
const f = require('../../server/tests/fixtures');
const { createApp } = require('../../server/src/app');

const client = {
  cities: async () => f.geocoding,
  reverse: async () => f.geocoding,
  current: async () => f.current,
  forecast: async () => f.forecast,
  air: async () => f.air,
};

(async () => {
  const app = createApp(client, { source: 'open-meteo' });
  const weather = (await request(app).get('/api/weather?city=São Paulo')).body;
  const cities = (await request(app).get('/api/cities?q=sao')).body;
  fs.writeFileSync(path.join(__dirname, 'weather.json'), JSON.stringify(weather, null, 2) + '\n');
  fs.writeFileSync(path.join(__dirname, 'cities.json'), JSON.stringify(cities, null, 2) + '\n');
  console.log('wrote weather.json and cities.json');
})();
