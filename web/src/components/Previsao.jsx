import { formatarHora, nomeDoDia, temperatura, urlIcone } from '../utils/formatar';

export function ProximasHoras({ horas, fuso, unidade }) {
  return (
    <section className="cartao">
      <h3>Próximas horas</h3>
      <ul className="horas">
        {horas.map((h) => (
          <li key={h.horario}>
            <span className="cinza">{formatarHora(h.horario, fuso)}</span>
            <img src={urlIcone(h.icone)} alt={h.descricao} title={h.descricao} width="48" height="48" />
            <strong>{temperatura(h.temperatura, unidade)}°</strong>
            <span className="chuva">{h.chuva_prob}% chuva</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ProximosDias({ dias, hoje, unidade }) {
  return (
    <section className="cartao">
      <h3>Próximos dias</h3>
      <ul className="dias">
        {dias.map((d) => (
          <li key={d.data}>
            <span className="dia">{nomeDoDia(d.data, hoje)}</span>
            <img src={urlIcone(d.icone)} alt={d.descricao} title={d.descricao} width="40" height="40" />
            <span className="chuva">{d.chuva_prob}%</span>
            <span>
              <span className="cinza">{temperatura(d.minima, unidade)}°</span>
              {' / '}
              <strong>{temperatura(d.maxima, unidade)}°</strong>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
