import { describe, expect, it } from 'vitest';
import { dataLocalIso, direcaoVento, formatarHora, fundoDoClima, nomeDoDia, temperatura } from './formatar';

describe('formatar', () => {
  it('mostra a hora da cidade e não a do computador', () => {
    const meioDiaUtc = Date.UTC(2024, 5, 1, 12) / 1000;
    expect(formatarHora(meioDiaUtc, -10800)).toBe('09:00'); // São Paulo
    expect(formatarHora(meioDiaUtc, 32400)).toBe('21:00'); // Tóquio
  });

  it('data local pode ser o dia anterior', () => {
    const madrugadaUtc = Date.UTC(2024, 5, 1, 1) / 1000;
    expect(dataLocalIso(madrugadaUtc, -10800)).toBe('2024-05-31');
  });

  it('nome dos dias', () => {
    expect(nomeDoDia('2024-06-01', '2024-06-01')).toBe('Hoje');
    expect(nomeDoDia('2024-06-02', '2024-06-01')).toBe('Amanhã');
    expect(nomeDoDia('2024-06-04', '2024-06-01')).toBe('Ter 04/06');
    expect(nomeDoDia('2024-07-01', '2024-06-30')).toBe('Amanhã'); // virada de mês
  });

  it('celsius pra fahrenheit', () => {
    expect(temperatura(0, 'F')).toBe(32);
    expect(temperatura(36.6, 'F')).toBe(98);
    expect(temperatura(21.4, 'C')).toBe(21);
  });

  it('direção do vento', () => {
    expect(direcaoVento(0)).toBe('N');
    expect(direcaoVento(90)).toBe('L');
    expect(direcaoVento(350)).toBe('N');
  });

  it('fundo da tela', () => {
    expect(fundoDoClima('01d')).toBe('limpo');
    expect(fundoDoClima('10d')).toBe('chuva');
    expect(fundoDoClima('10n')).toBe('noite');
  });
});
