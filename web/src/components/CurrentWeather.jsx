import { formatTime, fullName, temperature, windDirection, windSpeed } from '../utils/format';
import WeatherIcon from './WeatherIcon';

const AIR_COLORS = { 1: '#2e9e5b', 2: '#7cae1f', 3: '#d69e2e', 4: '#dd6b20', 5: '#c53030' };

// where the sun is between sunrise and sunset, from 0 to 1 (null at night)
export function daylightProgress(now, sunrise, sunset) {
  if (!sunrise || !sunset || now < sunrise || now > sunset) return null;
  return (now - sunrise) / (sunset - sunrise);
}

function SunPath({ current, offset }) {
  const progress = daylightProgress(current.updated_at, current.sunrise, current.sunset);
  // half circle from (10,50) to (110,50); the sun walks on it
  const angle = Math.PI * (1 - (progress ?? 0));
  const sx = 60 + 50 * Math.cos(angle);
  const sy = 50 - 50 * Math.sin(angle);
  const hours = Math.round(((current.sunset - current.sunrise) / 3600) * 10) / 10;

  return (
    <div className="sun-path">
      <svg viewBox="0 -9 120 63" aria-hidden="true">
        <path d="M10 50 A50 50 0 0 1 110 50" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" strokeDasharray="4 4" />
        {progress != null && (
          <>
            <path
              d={`M10 50 A50 50 0 0 1 ${sx.toFixed(1)} ${sy.toFixed(1)}`}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
            />
            <circle cx={sx} cy={sy} r="6" fill="#fbbf24" stroke="#fff" strokeWidth="2" />
          </>
        )}
        <line x1="4" y1="50" x2="116" y2="50" stroke="currentColor" strokeOpacity="0.3" />
      </svg>
      <div className="sun-times">
        <span><small>Sunrise</small>{formatTime(current.sunrise, offset)}</span>
        <span className="muted">{progress == null ? 'The sun is down' : `${hours} h of daylight`}</span>
        <span><small>Sunset</small>{formatTime(current.sunset, offset)}</span>
      </div>
    </div>
  );
}

export default function CurrentWeather({ location, current, air, unit }) {
  const offset = location.utc_offset;
  const t = (c) => `${temperature(c, unit)}°`;

  return (
    <section className="card current">
      <h2>{fullName(location)}</h2>
      <p className="muted">Now, {formatTime(current.updated_at, offset)} local time</p>

      <div className="main-info">
        <WeatherIcon icon={current.icon} size={112} label={current.description} />
        <div>
          <p className="temp">
            {temperature(current.temperature, unit)}
            <span className="temp-unit">°{unit}</span>
          </p>
          <p className="description">{current.description}</p>
          <p className="muted">
            Feels like {t(current.feels_like)} · L {t(current.min)} H {t(current.max)}
          </p>
        </div>
      </div>

      <dl className="details">
        <div><dt>Humidity</dt><dd>{current.humidity}%</dd></div>
        <div><dt>Wind</dt><dd>{windSpeed(current.wind_kmh, unit)} {windDirection(current.wind_deg)}</dd></div>
        <div><dt>Pressure</dt><dd>{current.pressure} hPa</dd></div>
        {current.visibility_km != null && <div><dt>Visibility</dt><dd>{current.visibility_km} km</dd></div>}
        {air && (
          <div>
            <dt>Air quality</dt>
            <dd>
              <span className="air-dot" style={{ background: AIR_COLORS[air.index] }} />
              {air.label}
            </dd>
          </div>
        )}
      </dl>

      {current.sunrise && current.sunset && <SunPath current={current} offset={offset} />}
    </section>
  );
}
