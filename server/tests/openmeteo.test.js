const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { createOpenMeteoClient } = require('../src/openmeteo');
const { buildResponse } = require('../src/transform');

// builds a response similar to Open-Meteo's, starting 1h ago
function fakeResponse() {
  const start = Math.floor(Date.now() / 3600000) * 3600 - 3600;
  const hours = Array.from({ length: 144 }, (_, i) => start + i * 3600);
  return {
    utc_offset_seconds: -10800,
    current: {
      time: start + 3600, temperature_2m: 29.3, relative_humidity_2m: 58, apparent_temperature: 33.1,
      is_day: 1, weather_code: 61, pressure_msl: 1015.9, wind_speed_10m: 4.2, wind_direction_10m: 114,
    },
    hourly: {
      time: hours,
      temperature_2m: hours.map((_, i) => 20 + (i % 10)),
      relative_humidity_2m: hours.map(() => 70),
      precipitation_probability: hours.map((_, i) => i % 100),
      weather_code: hours.map(() => 3),
      is_day: hours.map(() => 1),
      visibility: hours.map(() => 24000),
    },
    daily: {
      temperature_2m_min: [22, 21, 20, 20, 21, 22],
      temperature_2m_max: [31, 30, 29, 30, 31, 32],
      sunrise: [start, 0, 0, 0, 0, 0],
      sunset: [start + 12 * 3600, 0, 0, 0, 0, 0],
    },
  };
}

function fakeFetch(url) {
  const u = String(url);
  let body;
  if (u.includes('geocoding')) {
    body = { results: [{ name: 'Recife', admin1: 'Pernambuco', country_code: 'BR', latitude: -8.05, longitude: -34.88 }] };
  } else if (u.includes('air-quality')) {
    body = { current: { european_aqi: 41, pm10: 28.6, pm2_5: 17.3 } };
  } else {
    body = fakeResponse();
  }
  return Promise.resolve({ ok: true, status: 200, json: async () => body });
}

describe('Open-Meteo', () => {
  it('converts the cities to the OpenWeather format', async () => {
    const client = createOpenMeteoClient(fakeFetch);
    const [c] = await client.cities('recife');
    assert.deepEqual(c, { name: 'Recife', state: 'Pernambuco', country: 'BR', lat: -8.05, lon: -34.88 });
  });

  it('the final response comes out the same as with OpenWeather', async () => {
    const client = createOpenMeteoClient(fakeFetch);
    const [current, forecast, air] = await Promise.all([client.current(-8, -34), client.forecast(-8, -34), client.air(-8, -34)]);
    const r = buildResponse({ location: { name: 'Recife' }, current, forecast, air, source: 'open-meteo' });

    assert.equal(r.current.temperature, 29.3);
    assert.equal(r.current.description, 'Light rain');
    assert.equal(r.current.icon, '10d');
    assert.equal(r.current.wind_kmh, 15);
    assert.equal(r.current.visibility_km, 24);
    assert.equal(r.location.utc_offset, -10800);
    assert.equal(r.hours.length, 8);
    assert.ok(r.hours[0].time >= Date.now() / 1000 - 3600);
    assert.equal(r.days.length, 5);
    assert.equal(r.air_quality.label, 'Moderate'); // European index 41
  });

  it('the bigger city comes first', async () => {
    const paris = [
      { name: 'Paris', admin1: 'Texas', country_code: 'US', latitude: 33.6, longitude: -95.5, population: 24782 },
      { name: 'Paris', admin1: 'Île-de-France', country_code: 'FR', latitude: 48.85, longitude: 2.35, population: 2138551 },
    ];
    const client = createOpenMeteoClient(async () => ({ ok: true, status: 200, json: async () => ({ results: paris }) }));
    const [c] = await client.cities('paris', 1);
    assert.equal(c.country, 'FR');
  });

  it('a city that does not exist returns an empty list', async () => {
    const client = createOpenMeteoClient(async () => ({ ok: true, status: 200, json: async () => ({}) }));
    assert.deepEqual(await client.cities('nowhereville'), []);
  });
});
