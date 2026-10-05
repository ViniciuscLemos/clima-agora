import { direcaoVento, formatarHora, nomeCompleto, temperatura, urlIcone, velocidadeVento } from '../utils/formatar';

const CORES_AR = { 1: '#2e9e5b', 2: '#7cae1f', 3: '#d69e2e', 4: '#dd6b20', 5: '#c53030' };

export default function ClimaAtual({ local, atual, ar, unidade }) {
  const fuso = local.fuso_segundos;
  const t = (c) => `${temperatura(c, unidade)}°`;

  return (
    <section className="cartao">
      <h2>{nomeCompleto(local)}</h2>
      <p className="cinza">Agora, {formatarHora(atual.atualizado_em, fuso)} no horário local</p>

      <div className="principal">
        <img src={urlIcone(atual.icone, '4x')} alt="" width="110" height="110" />
        <div>
          <p className="temp">{temperatura(atual.temperatura, unidade)}°{unidade}</p>
          <p className="descricao">{atual.descricao}</p>
          <p className="cinza">Sensação de {t(atual.sensacao)}</p>
        </div>
      </div>

      <dl className="detalhes">
        <div><dt>Mín / Máx</dt><dd>{t(atual.minima)} / {t(atual.maxima)}</dd></div>
        <div><dt>Umidade</dt><dd>{atual.umidade}%</dd></div>
        <div><dt>Vento</dt><dd>{velocidadeVento(atual.vento_kmh, unidade)} {direcaoVento(atual.vento_graus)}</dd></div>
        <div><dt>Pressão</dt><dd>{atual.pressao} hPa</dd></div>
        {atual.visibilidade_km != null && <div><dt>Visibilidade</dt><dd>{atual.visibilidade_km} km</dd></div>}
        {atual.nascer_sol && <div><dt>Nascer do sol</dt><dd>{formatarHora(atual.nascer_sol, fuso)}</dd></div>}
        {atual.por_sol && <div><dt>Pôr do sol</dt><dd>{formatarHora(atual.por_sol, fuso)}</dd></div>}
        {ar && (
          <div>
            <dt>Qualidade do ar</dt>
            <dd style={{ color: CORES_AR[ar.indice] }}>{ar.rotulo}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}
