// Usado quando não tem chave da API. Responde sempre com o exemplo.json
// (uma resposta salva de São Paulo), só trocando o nome da cidade e
// empurrando os horários pra agora.
const exemplo = require('./exemplo.json');

const CIDADES = [
  { name: 'São Paulo', state: 'São Paulo', country: 'BR', lat: -23.55, lon: -46.63 },
  { name: 'Rio de Janeiro', state: 'Rio de Janeiro', country: 'BR', lat: -22.91, lon: -43.17 },
  { name: 'Belo Horizonte', state: 'Minas Gerais', country: 'BR', lat: -19.92, lon: -43.94 },
  { name: 'Salvador', state: 'Bahia', country: 'BR', lat: -12.97, lon: -38.5 },
  { name: 'Recife', state: 'Pernambuco', country: 'BR', lat: -8.05, lon: -34.88 },
  { name: 'Curitiba', state: 'Paraná', country: 'BR', lat: -25.43, lon: -49.27 },
  { name: 'Porto Alegre', state: 'Rio Grande do Sul', country: 'BR', lat: -30.03, lon: -51.22 },
  { name: 'Lisboa', country: 'PT', lat: 38.72, lon: -9.14 },
];

const semAcento = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function copiar(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// quanto falta somar nos horários do exemplo pra ele ficar "agora"
function diferenca(passo) {
  return Math.round((Date.now() / 1000 - exemplo.atual.dt) / passo) * passo;
}

function criarClienteDemo() {
  return {
    async cidades(q, limit = 5) {
      const achadas = CIDADES.filter((c) => semAcento(c.name).includes(semAcento(q)));
      if (achadas.length) return achadas.slice(0, limit);
      return [{ name: q, country: 'BR', lat: -23.55, lon: -46.63 }];
    },

    async reverso() {
      return [{ name: 'Sua localização', country: 'BR' }];
    },

    async agora() {
      const atual = copiar(exemplo.atual);
      const d = diferenca(3600);
      atual.dt += d;
      atual.sys.sunrise += d;
      atual.sys.sunset += d;
      return atual;
    },

    async previsao() {
      const previsao = copiar(exemplo.previsao);
      const d = diferenca(3 * 3600);
      previsao.list.forEach((item) => { item.dt += d; });
      return previsao;
    },

    async ar() {
      return copiar(exemplo.ar);
    },
  };
}

module.exports = { criarClienteDemo };
