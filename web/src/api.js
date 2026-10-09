async function get(url, signal) {
  let res;
  try {
    res = await fetch(url, { signal });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new Error("Couldn't reach the server. Is it running?");
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Error ${res.status}`);
  return body;
}

export function weatherByName(city, signal) {
  return get(`/api/weather?${new URLSearchParams({ city })}`, signal);
}

export function weatherByPlace({ lat, lon, name, state, country }, signal) {
  const params = new URLSearchParams({ lat, lon });
  if (name) params.set('name', name);
  if (state) params.set('state', state);
  if (country) params.set('country', country);
  return get(`/api/weather?${params}`, signal);
}

export function suggestCities(q, signal) {
  return get(`/api/cities?${new URLSearchParams({ q })}`, signal);
}
