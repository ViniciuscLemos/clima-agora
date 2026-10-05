import { useEffect, useState } from 'react';
import { sugerirCidades } from '../api';
import { nomeCompleto } from '../utils/formatar';

export default function Busca({ onBuscar, onEscolher, onLocalizar, carregando }) {
  const [texto, setTexto] = useState('');
  const [sugestoes, setSugestoes] = useState([]);
  const [mostrar, setMostrar] = useState(false);

  // espera parar de digitar uns 300ms antes de buscar sugestões
  useEffect(() => {
    const termo = texto.trim();
    if (termo.length < 2) {
      setSugestoes([]);
      return;
    }

    const controle = new AbortController();
    const timer = setTimeout(() => {
      sugerirCidades(termo, controle.signal)
        .then(setSugestoes)
        .catch(() => setSugestoes([]));
    }, 300);

    return () => {
      clearTimeout(timer);
      controle.abort();
    };
  }, [texto]);

  function limpar() {
    setTexto('');
    setSugestoes([]);
    setMostrar(false);
  }

  function enviar(e) {
    e.preventDefault();
    if (!texto.trim()) return;
    onBuscar(texto.trim());
    limpar();
  }

  function escolher(cidade) {
    onEscolher(cidade);
    limpar();
  }

  return (
    <form className="busca" onSubmit={enviar}>
      <div className="campo">
        <input
          type="text"
          value={texto}
          onChange={(e) => { setTexto(e.target.value); setMostrar(true); }}
          onFocus={() => setMostrar(true)}
          onBlur={() => setTimeout(() => setMostrar(false), 150)}
          placeholder="Digite uma cidade"
          aria-label="Cidade"
          autoComplete="off"
        />
        {mostrar && sugestoes.length > 0 && (
          <ul className="sugestoes">
            {sugestoes.map((c) => (
              // onMouseDown porque o onClick só dispara depois do blur, e aí a lista já sumiu
              <li key={`${c.lat},${c.lon}`} onMouseDown={() => escolher(c)}>
                {nomeCompleto(c)}
              </li>
            ))}
          </ul>
        )}
      </div>
      <button type="submit" disabled={carregando}>Buscar</button>
      <button type="button" className="secundario" onClick={onLocalizar} disabled={carregando}>
        Minha localização
      </button>
    </form>
  );
}
