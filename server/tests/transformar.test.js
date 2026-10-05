const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const f = require('./fixtures');
const { formatarCidade, formatarAtual, formatarHoras, formatarDias, formatarQualidadeAr, dataLocal } = require('../src/transformar');

describe('transformar', () => {
  it('usa o nome em português quando tem', () => {
    assert.equal(formatarCidade(f.geocoding[0]).nome, 'São Paulo');
    assert.equal(formatarCidade({ name: 'Paris', country: 'FR', lat: 1, lon: 2 }).nome, 'Paris');
  });

  it('converte o vento pra km/h', () => {
    const atual = formatarAtual(f.atual);
    assert.equal(atual.temperatura, 18.4);
    assert.equal(atual.vento_kmh, 13); // 3.6 m/s
    assert.equal(atual.descricao, 'Nublado');
  });

  it('data local usa o fuso da cidade', () => {
    const unix = Date.UTC(2024, 5, 1, 2) / 1000; // 02h UTC ainda é dia 31 em SP
    assert.equal(dataLocal(unix, -10800), '2024-05-31');
  });

  it('próximas horas', () => {
    const horas = formatarHoras(f.previsao);
    assert.equal(horas.length, 8);
    assert.equal(horas[1].chuva_prob, 10);
  });

  it('agrupa a previsão por dia', () => {
    const dias = formatarDias(f.previsao, f.FUSO_SP);
    assert.equal(dias.length, 5);
    assert.equal(dias[1].data, '2024-06-02');
    assert.equal(dias[1].chuva_prob, 40);
    assert.equal(dias[1].icone, '10d');
  });

  it('qualidade do ar', () => {
    assert.equal(formatarQualidadeAr(f.ar).rotulo, 'Razoável');
    assert.equal(formatarQualidadeAr(null), null);
  });
});
