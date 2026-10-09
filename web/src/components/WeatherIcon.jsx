// Weather icons drawn in SVG, from the OpenWeather icon codes ("01d", "10n"...).
// Open-Meteo answers are converted to the same codes on the server.
// They replace the PNGs from openweathermap.org: those were small, blurry when scaled
// up and the white clouds disappeared on the light card.

function Sun({ cx = 32, cy = 32, r = 11 }) {
  return (
    <g className="wi-sun">
      <g className="wi-rays" stroke="#f6a609" strokeWidth="3.2" strokeLinecap="round">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <line key={a} x1={cx} y1={cy - r - 5} x2={cx} y2={cy - r - 10} transform={`rotate(${a} ${cx} ${cy})`} />
        ))}
      </g>
      <circle cx={cx} cy={cy} r={r} fill="url(#wi-sun)" />
    </g>
  );
}

function Moon({ cx = 32, cy = 30 }) {
  return (
    <g className="wi-moon">
      <path
        d={`M${cx + 6} ${cy - 15} a15 15 0 1 0 10 22 a12 12 0 0 1 -10 -22z`}
        fill="url(#wi-moon)"
        stroke="#8f9cc4"
        strokeWidth="1"
      />
      <circle cx={cx + 14} cy={cy - 10} r="1.4" fill="#f6d77a" />
      <circle cx={cx + 19} cy={cy + 1} r="1" fill="#f6d77a" />
    </g>
  );
}

function Cloud({ x = 0, y = 0, scale = 1, dark = false }) {
  return (
    <path
      className="wi-cloud"
      transform={`translate(${x} ${y}) scale(${scale})`}
      d="M18 46h30a10 10 0 0 0 0-20a14 14 0 0 0-26.5-4A11 11 0 0 0 18 46z"
      fill={dark ? 'url(#wi-cloud-dark)' : 'url(#wi-cloud)'}
      stroke={dark ? '#7f8ba0' : '#a9b6c9'}
      strokeWidth="1.2"
    />
  );
}

function Rain({ heavy }) {
  const drops = heavy ? [22, 30, 38, 46] : [26, 36, 46];
  return (
    <g className="wi-rain" stroke="#3b82f6" strokeWidth="2.6" strokeLinecap="round">
      {drops.map((x, i) => (
        <line key={x} x1={x} y1={50} x2={x - 3} y2={57} style={{ animationDelay: `${i * 0.25}s` }} />
      ))}
    </g>
  );
}

function Snow() {
  return (
    <g className="wi-snow" fill="#93c5fd">
      {[24, 34, 44].map((x, i) => (
        <circle key={x} cx={x} cy={54} r="2.4" style={{ animationDelay: `${i * 0.35}s` }} />
      ))}
    </g>
  );
}

function Bolt() {
  return <path className="wi-bolt" d="M34 44l-7 11h6l-3 9 10-13h-6l4-7z" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />;
}

function Mist() {
  return (
    <g stroke="#94a3b8" strokeWidth="3.2" strokeLinecap="round">
      <line x1="14" y1="26" x2="50" y2="26" />
      <line x1="10" y1="34" x2="46" y2="34" />
      <line x1="18" y1="42" x2="54" y2="42" />
    </g>
  );
}

function shapes(code, night) {
  const SkyBody = night ? Moon : Sun;
  switch (code) {
    case '01':
      return night ? <Moon cx={30} cy={32} /> : <Sun />;
    case '02':
      return (
        <>
          <SkyBody cx={24} cy={24} r={9} />
          <Cloud x={10} y={6} scale={0.85} />
        </>
      );
    case '03':
      return <Cloud x={0} y={-2} />;
    case '04':
      return (
        <>
          <Cloud x={10} y={-8} scale={0.75} dark />
          <Cloud x={-2} y={0} />
        </>
      );
    case '09':
      return (
        <>
          <Cloud x={0} y={-8} dark />
          <Rain heavy />
        </>
      );
    case '10':
      return (
        <>
          <SkyBody cx={22} cy={20} r={8} />
          <Cloud x={4} y={-6} scale={0.95} />
          <Rain />
        </>
      );
    case '11':
      return (
        <>
          <Cloud x={0} y={-8} dark />
          <Bolt />
        </>
      );
    case '13':
      return (
        <>
          <Cloud x={0} y={-8} />
          <Snow />
        </>
      );
    case '50':
      return <Mist />;
    default:
      return <Cloud />;
  }
}

export default function WeatherIcon({ icon = '01d', size = 48, label = '' }) {
  const code = icon.slice(0, 2);
  const night = icon.endsWith('n');
  return (
    <svg
      className="weather-icon"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role={label ? 'img' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
    >
      {label && <title>{label}</title>}
      <defs>
        <radialGradient id="wi-sun" cx="40%" cy="35%">
          <stop offset="0" stopColor="#ffe17a" />
          <stop offset="1" stopColor="#f8a90b" />
        </radialGradient>
        <linearGradient id="wi-moon" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3f5ff" />
          <stop offset="1" stopColor="#c3cdf0" />
        </linearGradient>
        <linearGradient id="wi-cloud" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#dbe3ee" />
        </linearGradient>
        <linearGradient id="wi-cloud-dark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c7d0dd" />
          <stop offset="1" stopColor="#97a3b6" />
        </linearGradient>
      </defs>
      {shapes(code, night)}
    </svg>
  );
}
