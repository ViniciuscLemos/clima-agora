async function get(url, signal) {
  let res;
  try {
    res = await fetch(url, { signal });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new Error('Não consegui falar com o servidor. Ele tá rodando?');
  }

  const corpo = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(corpo.erro || `Erro ${res.status}`);
  return corpo;
}

export function climaPorNome(cidade, signal) {
  return get(`/api/clima?${new URLSearchParams({ cidade })}`, signal);
}

export function climaPorLocal({ lat, lon, nome, estado, pais }, signal) {
  const params = new URLSearchParams({ lat, lon });
  if (nome) params.set('nome', nome);
  if (estado) params.set('estado', estado);
  if (pais) params.set('pais', pais);
  return get(`/api/clima?${params}`, signal);
}

export function sugerirCidades(q, signal) {
  return get(`/api/cidades?${new URLSearchParams({ q })}`, signal);
}
