// takes the OpenWeather response and keeps only what the front end uses

const AIR_LABELS = {
  1: 'Good',
  2: 'Fair',
  3: 'Moderate',
  4: 'Poor',
  5: 'Very poor',
};

const round = (n, digits = 0) => Math.round(n * 10 ** digits) / 10 ** digits;

const capitalize = (text = '') => text.charAt(0).toUpperCase() + text.slice(1);

function placeName(place) {
  return place.local_names?.en || place.name;
}

function formatCity(place) {
  return {
    name: placeName(place),
    state: place.state || null,
    country: place.country,
    lat: place.lat,
    lon: place.lon,
  };
}

function formatCurrent(current) {
  const weather = current.weather?.[0] ?? {};
  return {
    temperature: round(current.main.temp, 1),
    feels_like: round(current.main.feels_like, 1),
    min: round(current.main.temp_min, 1),
    max: round(current.main.temp_max, 1),
    humidity: current.main.humidity,
    pressure: current.main.pressure,
    wind_kmh: round((current.wind?.speed ?? 0) * 3.6),
    wind_deg: current.wind?.deg ?? null,
    visibility_km: current.visibility != null ? round(current.visibility / 1000, 1) : null,
    description: capitalize(weather.description),
    icon: weather.icon,
    sunrise: current.sys?.sunrise ?? null,
    sunset: current.sys?.sunset ?? null,
    updated_at: current.dt,
  };
}

// adds the offset and reads it in UTC, so it doesn't depend on the server's timezone
function localDate(unix, offsetSeconds) {
  return new Date((unix + offsetSeconds) * 1000).toISOString().slice(0, 10);
}

function localHour(unix, offsetSeconds) {
  return new Date((unix + offsetSeconds) * 1000).getUTCHours();
}

function formatHours(forecast, count = 8) {
  // 8 x 3h = 24h
  return forecast.list.slice(0, count).map((item) => ({
    time: item.dt,
    temperature: round(item.main.temp),
    icon: item.weather?.[0]?.icon,
    description: capitalize(item.weather?.[0]?.description),
    rain_chance: Math.round((item.pop ?? 0) * 100),
  }));
}

// groups the 3h items by day (in the city's timezone)
function formatDays(forecast, offsetSeconds, count = 5) {
  const byDay = new Map();
  for (const item of forecast.list) {
    const day = localDate(item.dt, offsetSeconds);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day).push(item);
  }

  return [...byDay.entries()].slice(0, count).map(([date, items]) => {
    // uses the icon from the time closest to noon
    const typical = items.reduce((best, item) =>
      Math.abs(localHour(item.dt, offsetSeconds) - 12) < Math.abs(localHour(best.dt, offsetSeconds) - 12)
        ? item
        : best
    );
    const weather = typical.weather?.[0] ?? {};

    return {
      date,
      min: round(Math.min(...items.map((i) => i.main.temp_min))),
      max: round(Math.max(...items.map((i) => i.main.temp_max))),
      icon: weather.icon?.replace('n', 'd'),
      description: capitalize(weather.description),
      rain_chance: Math.round(Math.max(...items.map((i) => i.pop ?? 0)) * 100),
      humidity: Math.round(items.reduce((sum, i) => sum + i.main.humidity, 0) / items.length),
    };
  });
}

function formatAirQuality(air) {
  const item = air?.list?.[0];
  if (!item) return null;
  return {
    index: item.main.aqi,
    label: AIR_LABELS[item.main.aqi] ?? 'Unknown',
    pm2_5: round(item.components.pm2_5, 1),
    pm10: round(item.components.pm10, 1),
  };
}

function buildResponse({ location, current, forecast, air, source }) {
  const offset = current.timezone ?? forecast.city?.timezone ?? 0;
  return {
    location: { ...location, utc_offset: offset },
    current: formatCurrent(current),
    hours: formatHours(forecast),
    days: formatDays(forecast, offset),
    air_quality: formatAirQuality(air),
    source,
  };
}

module.exports = {
  formatCity,
  formatCurrent,
  formatHours,
  formatDays,
  formatAirQuality,
  buildResponse,
  localDate,
};
