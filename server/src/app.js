const express = require('express');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');

const { httpError } = require('./openweather');
const { formatCity, buildResponse } = require('./transform');

const TEN_MINUTES = 10 * 60 * 1000;
const WEB_FOLDER = path.join(__dirname, '..', '..', 'web', 'dist');

function createApp(client, { source = 'openweather' } = {}) {
  const app = express();
  app.set('trust proxy', 1); // so the rate limit gets the right IP on Render

  // cache by coordinate (2 decimal places is roughly 1 km)
  const cache = new Map();

  async function getWeather(lat, lon) {
    const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    const saved = cache.get(key);
    if (saved && saved.expires > Date.now()) return saved.data;

    const [current, forecast, air] = await Promise.all([
      client.current(lat, lon),
      client.forecast(lat, lon),
      client.air(lat, lon).catch(() => null), // if air quality fails, show the rest
    ]);

    const data = { current, forecast, air };
    cache.set(key, { data, expires: Date.now() + TEN_MINUTES });
    return data;
  }

  // Render calls this route to know the app is up (it sits before the rate limit)
  app.get('/api/health', (req, res) => res.json({ ok: true }));

  app.use('/api', rateLimit({ windowMs: 60 * 1000, limit: 60 }));

  app.get('/api/cities', async (req, res, next) => {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) return res.json([]);
    try {
      const cities = (await client.cities(q)).map(formatCity);
      // the APIs sometimes return the same city twice with slightly different coordinates
      const seen = new Set();
      res.json(cities.filter((c) => {
        const key = `${c.name}|${c.state}|${c.country}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }));
    } catch (e) {
      next(e);
    }
  });

  // /api/weather?city=Recife  or  /api/weather?lat=-8.05&lon=-34.88
  app.get('/api/weather', async (req, res, next) => {
    try {
      let location;

      if (req.query.city) {
        const name = String(req.query.city).trim();
        const [city] = await client.cities(name, 1);
        if (!city) throw httpError(404, `Couldn't find any city called "${name}".`);
        location = formatCity(city);
      } else if (req.query.lat && req.query.lon) {
        const lat = Number(req.query.lat);
        const lon = Number(req.query.lon);
        if (isNaN(lat) || isNaN(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
          throw httpError(400, 'Invalid latitude or longitude.');
        }

        if (req.query.name) {
          // when it comes from the autocomplete the name comes along
          location = { name: req.query.name, state: req.query.state || null, country: req.query.country || null, lat, lon };
        } else {
          const [found] = await client.reverse(lat, lon).catch(() => []);
          location = found ? { ...formatCity(found), lat, lon } : { name: 'Your location', state: null, country: null, lat, lon };
        }
      } else {
        throw httpError(400, 'Missing the city (?city=) or the coordinates (?lat=&lon=).');
      }

      const { current, forecast, air } = await getWeather(location.lat, location.lon);
      res.json(buildResponse({ location, current, forecast, air, source }));
    } catch (e) {
      next(e);
    }
  });

  // in production the server also serves the built front end
  if (fs.existsSync(WEB_FOLDER)) {
    app.use(express.static(WEB_FOLDER));
    app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(WEB_FOLDER, 'index.html')));
  }

  // eslint-disable-next-line no-unused-vars
  app.use((e, req, res, next) => {
    if (!e.status) console.error(e);
    res.status(e.status || 500).json({ error: e.status ? e.message : 'Something went wrong on the server.' });
  });

  return app;
}

module.exports = { createApp };
