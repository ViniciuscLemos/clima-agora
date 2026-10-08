import { useEffect, useState } from 'react';
import { sugerirCidades } from '../api';
import { nomeCompleto } from '../utils/formatar';

export default function Busca({ onBuscar, onEscolher, onLocalizar, carregando }) {
  const [texto, setTexto] = useState('');
  const [sugestoes, setSugestoes] = useState([]);
  const [mostrar, setMostrar] = useState(false);
  const [destaque, setDestaque] = useState(-1);

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
        .then((lista) => {
          setSugestoes(lista);
          setDestaque(-1);
        })
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
    setDestaque(-1);
  }

  const abertas = mostrar && sugestoes.length > 0;

  // setas pra andar nas sugestões, Enter escolhe e Esc fecha
  function teclar(e) {
    if (!abertas) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const passo = e.key === 'ArrowDown' ? 1 : -1;
      setDestaque((d) => (d + passo + sugestoes.length) % sugestoes.length);
    } else if (e.key === 'Escape') {
      setMostrar(false);
    }
  }

  function enviar(e) {
    e.preventDefault();
    if (abertas && destaque >= 0) {
      escolher(sugestoes[destaque]);
      return;
    }
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
          onKeyDown={teclar}
          onFocus={() => setMostrar(true)}
          onBlur={() => setTimeout(() => setMostrar(false), 150)}
          placeholder="Digite uma cidade"
          aria-label="Cidade"
          autoComplete="off"
          role="combobox"
          aria-expanded={abertas}
          aria-controls="sugestoes"
          aria-activedescendant={destaque >= 0 ? `sugestao-${destaque}` : undefined}
        />
        {abertas && (
          <ul className="sugestoes" id="sugestoes" role="listbox">
            {sugestoes.map((c, i) => (
              // onMouseDown porque o onClick só dispara depois do blur, e aí a lista já sumiu
              <li
                key={`${c.lat},${c.lon}`}
                id={`sugestao-${i}`}
                role="option"
                aria-selected={i === destaque}
                className={i === destaque ? 'destaque' : ''}
                onMouseEnter={() => setDestaque(i)}
                onMouseDown={() => escolher(c)}
              >
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
