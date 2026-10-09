import { dayName, formatTime, iconUrl, temperature } from '../utils/format';

export function NextHours({ hours, offset, unit }) {
  return (
    <section className="card">
      <h3>Next hours</h3>
      <ul className="hours">
        {hours.map((h) => (
          <li key={h.time}>
            <span className="muted">{formatTime(h.time, offset)}</span>
            <img src={iconUrl(h.icon)} alt={h.description} title={h.description} width="48" height="48" />
            <strong>{temperature(h.temperature, unit)}°</strong>
            <span className="rain">{h.rain_chance}% rain</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function NextDays({ days, today, unit }) {
  return (
    <section className="card">
      <h3>Next days</h3>
      <ul className="days">
        {days.map((d) => (
          <li key={d.date}>
            <span className="day">{dayName(d.date, today)}</span>
            <img src={iconUrl(d.icon)} alt={d.description} title={d.description} width="40" height="40" />
            <span className="rain">{d.rain_chance}%</span>
            <span>
              <span className="muted">{temperature(d.min, unit)}°</span>
              {' / '}
              <strong>{temperature(d.max, unit)}°</strong>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
