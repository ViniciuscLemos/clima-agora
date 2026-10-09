const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const f = require('./fixtures');
const { formatCity, formatCurrent, formatHours, formatDays, formatAirQuality, localDate } = require('../src/transform');

describe('transform', () => {
  it('uses the English name when there is one', () => {
    assert.equal(formatCity(f.geocoding[0]).name, 'São Paulo');
    assert.equal(formatCity({ name: 'Paris', country: 'FR', lat: 1, lon: 2 }).name, 'Paris');
  });

  it('converts wind to km/h', () => {
    const current = formatCurrent(f.current);
    assert.equal(current.temperature, 18.4);
    assert.equal(current.wind_kmh, 13); // 3.6 m/s
    assert.equal(current.description, 'Overcast clouds');
  });

  it("local date uses the city's timezone", () => {
    const unix = Date.UTC(2024, 5, 1, 2) / 1000; // 02h UTC is still the 31st in SP
    assert.equal(localDate(unix, -10800), '2024-05-31');
  });

  it('next hours', () => {
    const hours = formatHours(f.forecast);
    assert.equal(hours.length, 8);
    assert.equal(hours[1].rain_chance, 10);
  });

  it('groups the forecast by day', () => {
    const days = formatDays(f.forecast, f.SP_OFFSET);
    assert.equal(days.length, 5);
    assert.equal(days[1].date, '2024-06-02');
    assert.equal(days[1].rain_chance, 40);
    assert.equal(days[1].icon, '10d');
  });

  it('air quality', () => {
    assert.equal(formatAirQuality(f.air).label, 'Fair');
    assert.equal(formatAirQuality(null), null);
  });
});
