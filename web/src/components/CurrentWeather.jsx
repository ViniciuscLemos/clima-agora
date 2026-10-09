import { formatTime, fullName, iconUrl, temperature, windDirection, windSpeed } from '../utils/format';

const AIR_COLORS = { 1: '#2e9e5b', 2: '#7cae1f', 3: '#d69e2e', 4: '#dd6b20', 5: '#c53030' };

export default function CurrentWeather({ location, current, air, unit }) {
  const offset = location.utc_offset;
  const t = (c) => `${temperature(c, unit)}°`;

  return (
    <section className="card">
      <h2>{fullName(location)}</h2>
      <p className="muted">Now, {formatTime(current.updated_at, offset)} local time</p>

      <div className="main-info">
        <img src={iconUrl(current.icon, '4x')} alt="" width="110" height="110" />
        <div>
          <p className="temp">{temperature(current.temperature, unit)}°{unit}</p>
          <p className="description">{current.description}</p>
          <p className="muted">Feels like {t(current.feels_like)}</p>
        </div>
      </div>

      <dl className="details">
        <div><dt>Low / High</dt><dd>{t(current.min)} / {t(current.max)}</dd></div>
        <div><dt>Humidity</dt><dd>{current.humidity}%</dd></div>
        <div><dt>Wind</dt><dd>{windSpeed(current.wind_kmh, unit)} {windDirection(current.wind_deg)}</dd></div>
        <div><dt>Pressure</dt><dd>{current.pressure} hPa</dd></div>
        {current.visibility_km != null && <div><dt>Visibility</dt><dd>{current.visibility_km} km</dd></div>}
        {current.sunrise && <div><dt>Sunrise</dt><dd>{formatTime(current.sunrise, offset)}</dd></div>}
        {current.sunset && <div><dt>Sunset</dt><dd>{formatTime(current.sunset, offset)}</dd></div>}
        {air && (
          <div>
            <dt>Air quality</dt>
            <dd style={{ color: AIR_COLORS[air.index] }}>{air.label}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}
