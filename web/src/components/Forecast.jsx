import { dayName, formatTime, temperature } from '../utils/format';
import WeatherIcon from './WeatherIcon';

// line through the temperatures, drawn behind the hour columns.
// The viewBox has one 100-wide slot per hour, so each point sits in the middle of its column
function TemperatureLine({ values }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  // 8 to 52 out of 60, so the line never touches the edges
  const y = (v) => 52 - ((v - min) / span) * 44;
  const points = values.map((v, i) => [i * 100 + 50, y(v)]);
  const line = points.map(([px, py], i) => `${i ? 'L' : 'M'}${px} ${py}`).join(' ');
  const width = values.length * 100;
  const area = `${line} L${width - 50} 60 L50 60 Z`;

  return (
    <svg className="temp-line" viewBox={`0 0 ${width} 60`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="temp-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f59e0b" stopOpacity="0.35" />
          <stop offset="1" stopColor="#f59e0b" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#temp-area)" />
      <path d={line} fill="none" stroke="#f59e0b" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

export function NextHours({ hours, offset, unit }) {
  const temps = hours.map((h) => temperature(h.temperature, unit));
  return (
    <section className="card">
      <h3>Next hours</h3>
      <div className="hours-scroll">
        <div className="hours" style={{ '--count': hours.length }}>
          <TemperatureLine values={temps} />
          <ul>
            {hours.map((h, i) => (
              <li key={h.time}>
                <strong className="hour-temp">{temps[i]}°</strong>
                <WeatherIcon icon={h.icon} size={40} label={h.description} />
                <span className={`rain ${h.rain_chance ? '' : 'none'}`}>{h.rain_chance}%</span>
                <span className="muted hour">{formatTime(h.time, offset)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function NextDays({ days, today, unit }) {
  // the bars use the same scale for the whole week, like on phone weather apps:
  // you can see at a glance which day is colder or hotter
  const lows = days.map((d) => temperature(d.min, unit));
  const highs = days.map((d) => temperature(d.max, unit));
  const weekMin = Math.min(...lows);
  const span = Math.max(...highs) - weekMin || 1;

  return (
    <section className="card">
      <h3>Next days</h3>
      <ul className="days">
        {days.map((d, i) => (
          <li key={d.date}>
            <span className="day">{dayName(d.date, today)}</span>
            <WeatherIcon icon={d.icon} size={34} label={d.description} />
            <span className={`rain ${d.rain_chance ? '' : 'none'}`}>{d.rain_chance}%</span>
            <span className="muted low">{lows[i]}°</span>
            <span className="range">
              <span
                className="range-fill"
                style={{
                  left: `${((lows[i] - weekMin) / span) * 100}%`,
                  width: `${Math.max(((highs[i] - lows[i]) / span) * 100, 4)}%`,
                }}
              />
            </span>
            <strong className="high">{highs[i]}°</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}
