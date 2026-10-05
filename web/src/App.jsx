import { useEffect, useRef, useState } from 'react';
import { climaPorLocal, climaPorNome } from './api';
import { dataLocalIso, fundoDoClima } from './utils/formatar';
import Busca from './components/Busca';
import ClimaAtual from './components/ClimaAtual';
import { ProximasHoras, ProximosDias } from './components/Previsao';

function lerSalvo(chave, padrao) {
  try {
    return JSON.parse(localStorage.getItem(chave)) ?? padrao;
  } catch {
    return padrao;
  }
}

function salvar(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    // aba anônima com storage bloqueado, só não salva
  }
}

export default function App() {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [unidade, setUnidade] = useState(() => lerSalvo('unidade', 'C'));
  const [recentes, setRecentes] = useState(() => lerSalvo('recentes', []));
  const ultimaBusca = useRef(null);

  useEffect(() => salvar('unidade', unidade), [unidade]);
  useEffect(() => salvar('recentes', recentes), [recentes]);

  async function carregar(buscar) {
    // se a pessoa buscar outra cidade antes da primeira responder, cancela a anterior
    ultimaBusca.current?.abort();
    const controle = new AbortController();
    ultimaBusca.current = controle;

    setCarregando(true);
    setErro('');
    try {
      const resposta = await buscar(controle.signal);
      setDados(resposta);

      const { nome, estado, pais, lat, lon } = resposta.local;
      setRecentes((lista) => [
        { nome, estado, pais, lat, lon },
        ...lista.filter((c) => c.nome !== nome || c.pais !== pais),
      ].slice(0, 5));
    } catch (e) {
      if (e.name !== 'AbortError') setErro(e.message);
    } finally {
      if (ultimaBusca.current === controle) setCarregando(false);
    }
  }

  const buscarNome = (nome) => carregar((signal) => climaPorNome(nome, signal));
  const buscarLocal = (local) => carregar((signal) => climaPorLocal(local, signal));

  function minhaLocalizacao() {
    if (!navigator.geolocation) {
      setErro('Seu navegador não tem localização.');
      return;
    }
    setCarregando(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => buscarLocal({ lat: pos.coords.latitude.toFixed(4), lon: pos.coords.longitude.toFixed(4) }),
      () => {
        setCarregando(false);
        setErro('Não deu pra pegar sua localização. Confere se o navegador tem permissão.');
      },
      { timeout: 10000 }
    );
  }

  // abre direto na última cidade pesquisada
  useEffect(() => {
    if (recentes.length) buscarLocal(recentes[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hoje = dados && dataLocalIso(dados.atual.atualizado_em, dados.local.fuso_segundos);

  return (
    <div className={`app ${dados ? fundoDoClima(dados.atual.icone) : ''}`}>
      <header>
        <h1>Clima Agora</h1>
        <div className="unidades">
          <button className={unidade === 'C' ? 'ativo' : ''} onClick={() => setUnidade('C')}>°C</button>
          <button className={unidade === 'F' ? 'ativo' : ''} onClick={() => setUnidade('F')}>°F</button>
        </div>
      </header>

      <main>
        <Busca onBuscar={buscarNome} onEscolher={buscarLocal} onLocalizar={minhaLocalizacao} carregando={carregando} />

        {recentes.length > 0 && (
          <div className="recentes">
            <span className="cinza">Recentes:</span>
            {recentes.map((c) => (
              <button key={`${c.lat},${c.lon}`} className="chip" onClick={() => buscarLocal(c)}>{c.nome}</button>
            ))}
            <button className="link" onClick={() => setRecentes([])}>limpar</button>
          </div>
        )}

        {dados?.demo && (
          <p className="aviso">
            Rodando sem chave da API, então esses dados são de exemplo. Coloque sua chave em <code>server/.env</code> pra ver o clima de verdade.
          </p>
        )}

        {erro && <p className="erro">{erro}</p>}

        {!dados && !erro && (
          <p className="vazio">{carregando ? 'Carregando...' : 'Pesquise uma cidade pra ver o clima.'}</p>
        )}

        {dados && (
          <div className={`grade ${carregando ? 'carregando' : ''}`}>
            <ClimaAtual local={dados.local} atual={dados.atual} ar={dados.qualidade_ar} unidade={unidade} />
            <div className="coluna">
              <ProximasHoras horas={dados.horas} fuso={dados.local.fuso_segundos} unidade={unidade} />
              <ProximosDias dias={dados.dias} hoje={hoje} unidade={unidade} />
            </div>
          </div>
        )}
      </main>

      <footer>
        Dados da <a href="https://openweathermap.org/" target="_blank" rel="noreferrer">OpenWeather</a> ·
        feito por <a href="https://github.com/ViniciuscLemos" target="_blank" rel="noreferrer">Vinicius Lemos</a>
      </footer>
    </div>
  );
}
