const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { createApp } = require('./app');
const { createClient } = require('./openweather');
const { createOpenMeteoClient } = require('./openmeteo');

const key = process.env.OPENWEATHER_API_KEY;
const PORT = process.env.PORT || 3001;

// with a key it uses OpenWeather, without one it uses Open-Meteo (free, no key needed)
const client = key ? createClient(key) : createOpenMeteoClient();
const source = key ? 'openweather' : 'open-meteo';

if (!key) {
  console.log('No OPENWEATHER_API_KEY in server/.env, using Open-Meteo.');
}

const app = createApp(client, { source });

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
