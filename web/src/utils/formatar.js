const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DIRECOES = ['N', 'NE', 'L', 'SE', 'S', 'SO', 'O', 'NO'];

// soma o fuso da cidade e lê em UTC, assim mostra a hora da cidade
// e não a do computador de quem tá usando
function dataNaCidade(unix, fusoSegundos) {
  return new Date((unix + fusoSegundos) * 1000);
}

export function formatarHora(unix, fusoSegundos) {
  const d = dataNaCidade(unix, fusoSegundos);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function dataLocalIso(unix, fusoSegundos) {
  return dataNaCidade(unix, fusoSegundos).toISOString().slice(0, 10);
}

// "Hoje", "Amanhã" ou "Dom 02/06"
export function nomeDoDia(dataIso, hojeIso) {
  if (dataIso === hojeIso) return 'Hoje';
  const [ano, mes, dia] = dataIso.split('-').map(Number);
  const [anoH, mesH, diaH] = hojeIso.split('-').map(Number);
  const diferenca = (Date.UTC(ano, mes - 1, dia) - Date.UTC(anoH, mesH - 1, diaH)) / 86_400_000;
  if (diferenca === 1) return 'Amanhã';
  const semana = DIAS[new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay()];
  return `${semana} ${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}`;
}

export function temperatura(celsius, unidade) {
  const valor = unidade === 'F' ? (celsius * 9) / 5 + 32 : celsius;
  return Math.round(valor);
}

export function velocidadeVento(kmh, unidade) {
  return unidade === 'F' ? `${Math.round(kmh / 1.609)} mph` : `${Math.round(kmh)} km/h`;
}

export function direcaoVento(graus) {
  if (graus == null) return '';
  return DIRECOES[Math.round(((graus % 360) + 360) % 360 / 45) % 8];
}

export function urlIcone(icone, tamanho = '2x') {
  return `https://openweathermap.org/img/wn/${icone}@${tamanho}.png`;
}

// classe do fundo da tela a partir do ícone (o "n" no final é noite)
export function fundoDoClima(icone = '01d') {
  if (icone.endsWith('n')) return 'noite';
  const codigo = icone.slice(0, 2);
  if (codigo === '01') return 'limpo';
  if (['09', '10', '11'].includes(codigo)) return 'chuva';
  return 'nublado';
}

export function nomeCompleto(local) {
  return [local.nome, local.estado, local.pais].filter(Boolean).join(', ');
}
