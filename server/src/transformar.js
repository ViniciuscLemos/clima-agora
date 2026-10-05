// pega a resposta da OpenWeather e deixa só o que o front usa, em português

const ROTULOS_AR = {
  1: 'Boa',
  2: 'Razoável',
  3: 'Moderada',
  4: 'Ruim',
  5: 'Muito ruim',
};

const arredondar = (n, casas = 0) => Math.round(n * 10 ** casas) / 10 ** casas;

const capitalizar = (texto = '') => texto.charAt(0).toUpperCase() + texto.slice(1);

function nomeLocal(local) {
  return local.local_names?.pt || local.name;
}

function formatarCidade(local) {
  return {
    nome: nomeLocal(local),
    estado: local.state || null,
    pais: local.country,
    lat: local.lat,
    lon: local.lon,
  };
}

function formatarAtual(atual) {
  const clima = atual.weather?.[0] ?? {};
  return {
    temperatura: arredondar(atual.main.temp, 1),
    sensacao: arredondar(atual.main.feels_like, 1),
    minima: arredondar(atual.main.temp_min, 1),
    maxima: arredondar(atual.main.temp_max, 1),
    umidade: atual.main.humidity,
    pressao: atual.main.pressure,
    vento_kmh: arredondar((atual.wind?.speed ?? 0) * 3.6),
    vento_graus: atual.wind?.deg ?? null,
    visibilidade_km: atual.visibility != null ? arredondar(atual.visibility / 1000, 1) : null,
    descricao: capitalizar(clima.description),
    icone: clima.icon,
    nascer_sol: atual.sys?.sunrise ?? null,
    por_sol: atual.sys?.sunset ?? null,
    atualizado_em: atual.dt,
  };
}

// soma o fuso e lê em UTC, assim não depende do fuso do servidor
function dataLocal(unix, fusoSegundos) {
  return new Date((unix + fusoSegundos) * 1000).toISOString().slice(0, 10);
}

function horaLocal(unix, fusoSegundos) {
  return new Date((unix + fusoSegundos) * 1000).getUTCHours();
}

function formatarHoras(previsao, quantidade = 8) {
  // 8 x 3h = 24h
  return previsao.list.slice(0, quantidade).map((item) => ({
    horario: item.dt,
    temperatura: arredondar(item.main.temp),
    icone: item.weather?.[0]?.icon,
    descricao: capitalizar(item.weather?.[0]?.description),
    chuva_prob: Math.round((item.pop ?? 0) * 100),
  }));
}

// agrupa os itens de 3h por dia (no fuso da cidade)
function formatarDias(previsao, fusoSegundos, quantidade = 5) {
  const porDia = new Map();
  for (const item of previsao.list) {
    const dia = dataLocal(item.dt, fusoSegundos);
    if (!porDia.has(dia)) porDia.set(dia, []);
    porDia.get(dia).push(item);
  }

  return [...porDia.entries()].slice(0, quantidade).map(([data, itens]) => {
    // usa o ícone do horário mais perto do meio-dia
    const representativo = itens.reduce((melhor, item) =>
      Math.abs(horaLocal(item.dt, fusoSegundos) - 12) < Math.abs(horaLocal(melhor.dt, fusoSegundos) - 12)
        ? item
        : melhor
    );
    const clima = representativo.weather?.[0] ?? {};

    return {
      data,
      minima: arredondar(Math.min(...itens.map((i) => i.main.temp_min))),
      maxima: arredondar(Math.max(...itens.map((i) => i.main.temp_max))),
      icone: clima.icon?.replace('n', 'd'),
      descricao: capitalizar(clima.description),
      chuva_prob: Math.round(Math.max(...itens.map((i) => i.pop ?? 0)) * 100),
      umidade: Math.round(itens.reduce((soma, i) => soma + i.main.humidity, 0) / itens.length),
    };
  });
}

function formatarQualidadeAr(ar) {
  const item = ar?.list?.[0];
  if (!item) return null;
  return {
    indice: item.main.aqi,
    rotulo: ROTULOS_AR[item.main.aqi] ?? 'Desconhecida',
    pm2_5: arredondar(item.components.pm2_5, 1),
    pm10: arredondar(item.components.pm10, 1),
  };
}

function montarResposta({ local, atual, previsao, ar, fonte }) {
  const fuso = atual.timezone ?? previsao.city?.timezone ?? 0;
  return {
    local: { ...local, fuso_segundos: fuso },
    atual: formatarAtual(atual),
    horas: formatarHoras(previsao),
    dias: formatarDias(previsao, fuso),
    qualidade_ar: formatarQualidadeAr(ar),
    fonte,
  };
}

module.exports = {
  formatarCidade,
  formatarAtual,
  formatarHoras,
  formatarDias,
  formatarQualidadeAr,
  montarResposta,
  dataLocal,
};
