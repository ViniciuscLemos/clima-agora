import { useEffect, useState } from 'react';
import { suggestCities } from '../api';
import { fullName } from '../utils/format';

export default function Search({ onSearch, onPick, onLocate, loading }) {
  const [text, setText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [show, setShow] = useState(false);
  const [highlight, setHighlight] = useState(-1);

  // waits for the typing to stop for about 300ms before fetching suggestions
  useEffect(() => {
    const term = text.trim();
    if (term.length < 2) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      suggestCities(term, controller.signal)
        .then((list) => {
          setSuggestions(list);
          setHighlight(-1);
        })
        .catch(() => setSuggestions([]));
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [text]);

  function reset() {
    setText('');
    setSuggestions([]);
    setShow(false);
    setHighlight(-1);
  }

  const open = show && suggestions.length > 0;

  // arrows move through the suggestions, Enter picks and Esc closes
  function onKeyDown(e) {
    if (!open) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setHighlight((h) => (h + step + suggestions.length) % suggestions.length);
    } else if (e.key === 'Escape') {
      setShow(false);
    }
  }

  function submit(e) {
    e.preventDefault();
    if (open && highlight >= 0) {
      pick(suggestions[highlight]);
      return;
    }
    if (!text.trim()) return;
    onSearch(text.trim());
    reset();
  }

  function pick(city) {
    onPick(city);
    reset();
  }

  return (
    <form className="search" onSubmit={submit}>
      <div className="field">
        <input
          type="text"
          value={text}
          onChange={(e) => { setText(e.target.value); setShow(true); }}
          onKeyDown={onKeyDown}
          onFocus={() => setShow(true)}
          onBlur={() => setTimeout(() => setShow(false), 150)}
          placeholder="Type a city"
          aria-label="City"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls="suggestions"
          aria-activedescendant={highlight >= 0 ? `suggestion-${highlight}` : undefined}
        />
        {open && (
          <ul className="suggestions" id="suggestions" role="listbox">
            {suggestions.map((c, i) => (
              // onMouseDown because onClick only fires after the blur, and by then the list is gone
              <li
                key={`${c.lat},${c.lon}`}
                id={`suggestion-${i}`}
                role="option"
                aria-selected={i === highlight}
                className={i === highlight ? 'highlight' : ''}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={() => pick(c)}
              >
                {fullName(c)}
              </li>
            ))}
          </ul>
        )}
      </div>
      <button type="submit" disabled={loading}>Search</button>
      <button type="button" className="secondary" onClick={onLocate} disabled={loading}>
        My location
      </button>
    </form>
  );
}
