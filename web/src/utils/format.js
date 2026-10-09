const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

// adds the city's offset and reads it in UTC, so it shows the city's time
// and not the time on the computer of whoever is using it
function dateInCity(unix, offsetSeconds) {
  return new Date((unix + offsetSeconds) * 1000);
}

export function formatTime(unix, offsetSeconds) {
  const d = dateInCity(unix, offsetSeconds);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function localIsoDate(unix, offsetSeconds) {
  return dateInCity(unix, offsetSeconds).toISOString().slice(0, 10);
}

// "Today", "Tomorrow" or "Sun 06/02"
export function dayName(isoDate, todayIso) {
  if (isoDate === todayIso) return 'Today';
  const [year, month, day] = isoDate.split('-').map(Number);
  const [yearT, monthT, dayT] = todayIso.split('-').map(Number);
  const diff = (Date.UTC(year, month - 1, day) - Date.UTC(yearT, monthT - 1, dayT)) / 86_400_000;
  if (diff === 1) return 'Tomorrow';
  const weekday = DAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return `${weekday} ${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
}

export function temperature(celsius, unit) {
  const value = unit === 'F' ? (celsius * 9) / 5 + 32 : celsius;
  return Math.round(value);
}

export function windSpeed(kmh, unit) {
  return unit === 'F' ? `${Math.round(kmh / 1.609)} mph` : `${Math.round(kmh)} km/h`;
}

export function windDirection(degrees) {
  if (degrees == null) return '';
  return DIRECTIONS[Math.round(((degrees % 360) + 360) % 360 / 45) % 8];
}

// background class from the icon (the "n" at the end means night)
export function backgroundFor(icon = '01d') {
  if (icon.endsWith('n')) return 'night';
  const code = icon.slice(0, 2);
  if (code === '01') return 'clear';
  if (['09', '10', '11'].includes(code)) return 'rain';
  return 'cloudy';
}

export function fullName(place) {
  return [place.name, place.state, place.country].filter(Boolean).join(', ');
}
