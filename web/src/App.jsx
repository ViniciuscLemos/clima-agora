import { useEffect, useRef, useState } from 'react';
import { weatherByName, weatherByPlace } from './api';
import { backgroundFor, localIsoDate } from './utils/format';
import Search from './components/Search';
import BrazilCities from './components/BrazilCities';
import CurrentWeather from './components/CurrentWeather';
import { NextDays, NextHours } from './components/Forecast';

function readSaved(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // private tab with storage blocked, it just doesn't save
  }
}

export default function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [unit, setUnit] = useState(() => readSaved('unit', 'C'));
  const [recent, setRecent] = useState(() => readSaved('recent', []));
  const lastSearch = useRef(null);

  useEffect(() => save('unit', unit), [unit]);
  useEffect(() => save('recent', recent), [recent]);

  async function load(fetcher) {
    // if the person searches another city before the first one answers, cancel the previous one
    lastSearch.current?.abort();
    const controller = new AbortController();
    lastSearch.current = controller;

    setLoading(true);
    setError('');
    try {
      const response = await fetcher(controller.signal);
      setData(response);

      const { name, state, country, lat, lon } = response.location;
      setRecent((list) => [
        { name, state, country, lat, lon },
        ...list.filter((c) => c.name !== name || c.country !== country),
      ].slice(0, 5));
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message);
    } finally {
      if (lastSearch.current === controller) setLoading(false);
    }
  }

  const searchName = (name) => load((signal) => weatherByName(name, signal));
  const searchPlace = (place) => load((signal) => weatherByPlace(place, signal));

  function myLocation() {
    if (!navigator.geolocation) {
      setError("Your browser doesn't support location.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => searchPlace({ lat: pos.coords.latitude.toFixed(4), lon: pos.coords.longitude.toFixed(4) }),
      () => {
        setLoading(false);
        setError("Couldn't get your location. Check if the browser has permission.");
      },
      { timeout: 10000 }
    );
  }

  // opens straight on the last searched city
  useEffect(() => {
    if (recent.length) searchPlace(recent[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const today = data && localIsoDate(data.current.updated_at, data.location.utc_offset);

  return (
    <div className={`app ${data ? 'bg-' + backgroundFor(data.current.icon) : ''}`}>
      <header>
        <h1>Weather Now</h1>
        <div className="units">
          <button className={unit === 'C' ? 'active' : ''} onClick={() => setUnit('C')}>°C</button>
          <button className={unit === 'F' ? 'active' : ''} onClick={() => setUnit('F')}>°F</button>
        </div>
      </header>

      <main>
        <Search onSearch={searchName} onPick={searchPlace} onLocate={myLocation} loading={loading} />

        {recent.length > 0 && (
          <div className="recent">
            <span className="muted">Recent:</span>
            {recent.map((c) => (
              <button key={`${c.lat},${c.lon}`} className="chip" onClick={() => searchPlace(c)}>{c.name}</button>
            ))}
            <button className="link" onClick={() => setRecent([])}>clear</button>
          </div>
        )}

        {error && <p className="error">{error}</p>}

        {!data && !error && (
          <p className="empty">{loading ? 'Loading...' : 'Search for a city to see the weather.'}</p>
        )}

        {!data && !loading && <BrazilCities onPick={searchPlace} />}

        {data && (
          <div className={`grid ${loading ? 'loading' : ''}`}>
            <CurrentWeather location={data.location} current={data.current} air={data.air_quality} unit={unit} />
            <div className="column">
              <NextHours hours={data.hours} offset={data.location.utc_offset} unit={unit} />
              <NextDays days={data.days} today={today} unit={unit} />
            </div>
          </div>
        )}
      </main>

      <footer>
        {/* only shows the source after the first search, before that there's no way to know which one it is */}
        {data?.source === 'open-meteo' && <>Data from <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a> · </>}
        {data?.source === 'openweather' && <>Data from <a href="https://openweathermap.org/" target="_blank" rel="noreferrer">OpenWeather</a> · </>}
        made by <a href="https://github.com/ViniciuscLemos" target="_blank" rel="noreferrer">Vinicius Lemos</a>
      </footer>
    </div>
  );
}
