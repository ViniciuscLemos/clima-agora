const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const f = require('./fixtures');
const { createApp } = require('../src/app');

// fake client in place of OpenWeather, counting the calls
function fakeClient(extra = {}) {
  const calls = { cities: 0, current: 0 };
  const client = {
    cities: async (q) => {
      calls.cities++;
      return q.toLowerCase().includes('paulo') ? f.geocoding : [];
    },
    reverse: async () => f.geocoding,
    current: async () => {
      calls.current++;
      return f.current;
    },
    forecast: async () => f.forecast,
    air: async () => f.air,
    ...extra,
  };
  return { client, calls };
}

describe('GET /api/weather', () => {
  it('searches by city name', async () => {
    const { client } = fakeClient();
    const res = await request(createApp(client)).get('/api/weather?city=São Paulo');

    assert.equal(res.status, 200);
    assert.equal(res.body.location.name, 'São Paulo');
    assert.equal(res.body.current.description, 'Overcast clouds');
    assert.equal(res.body.days.length, 5);
    assert.equal(res.body.hours.length, 8);
    assert.equal(res.body.air_quality.label, 'Fair');
  });

  it("doesn't call the API again for the same city (cache)", async () => {
    const { client, calls } = fakeClient();
    const app = createApp(client);
    await request(app).get('/api/weather?city=São Paulo');
    await request(app).get('/api/weather?city=São Paulo');
    assert.equal(calls.current, 1);
  });

  it('a city that does not exist gives 404', async () => {
    const { client } = fakeClient();
    const res = await request(createApp(client)).get('/api/weather?city=Nowhereville');
    assert.equal(res.status, 404);
    assert.match(res.body.error, /Nowhereville/);
  });

  it('no city and no coordinates gives 400', async () => {
    const { client } = fakeClient();
    const app = createApp(client);
    assert.equal((await request(app).get('/api/weather')).status, 400);
    assert.equal((await request(app).get('/api/weather?lat=abc&lon=1')).status, 400);
  });

  it('searches by coordinates and uses the name sent along', async () => {
    const { client } = fakeClient();
    const res = await request(createApp(client)).get('/api/weather?lat=-8.05&lon=-34.88&name=Recife&country=BR');
    assert.equal(res.status, 200);
    assert.equal(res.body.location.name, 'Recife');
  });

  it('still works if air quality fails', async () => {
    const { client } = fakeClient({ air: async () => { throw new Error('offline'); } });
    const res = await request(createApp(client)).get('/api/weather?city=São Paulo');
    assert.equal(res.status, 200);
    assert.equal(res.body.air_quality, null);
  });
});

describe('GET /api/health', () => {
  it('answers ok without calling the weather API', async () => {
    const { client, calls } = fakeClient();
    const res = await request(createApp(client)).get('/api/health');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { ok: true });
    assert.equal(calls.current, 0);
  });
});

describe('GET /api/cities', () => {
  it('returns the suggestions', async () => {
    const { client } = fakeClient();
    const res = await request(createApp(client)).get('/api/cities?q=sao paulo');
    assert.equal(res.body[0].name, 'São Paulo');
  });

  it("doesn't repeat the same city", async () => {
    const repeated = { name: 'Curitiba', state: 'Rio de Janeiro', country: 'BR', lat: -22.1, lon: -43.2 };
    const { client } = fakeClient({
      cities: async () => [repeated, { ...repeated, lat: -22.2 }, { ...repeated, state: 'Paraná' }],
    });
    const res = await request(createApp(client)).get('/api/cities?q=curitiba');
    assert.deepEqual(res.body.map((c) => c.state), ['Rio de Janeiro', 'Paraná']);
  });

  it("with fewer than 2 letters it doesn't even call the API", async () => {
    const { client, calls } = fakeClient();
    const res = await request(createApp(client)).get('/api/cities?q=s');
    assert.deepEqual(res.body, []);
    assert.equal(calls.cities, 0);
  });
});
