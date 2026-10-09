import { describe, expect, it } from 'vitest';
import { backgroundFor, dayName, formatTime, localIsoDate, temperature, windDirection } from './format';

describe('format', () => {
  it("shows the city's time and not the computer's", () => {
    const noonUtc = Date.UTC(2024, 5, 1, 12) / 1000;
    expect(formatTime(noonUtc, -10800)).toBe('09:00'); // São Paulo
    expect(formatTime(noonUtc, 32400)).toBe('21:00'); // Tokyo
  });

  it('local date can be the day before', () => {
    const earlyUtc = Date.UTC(2024, 5, 1, 1) / 1000;
    expect(localIsoDate(earlyUtc, -10800)).toBe('2024-05-31');
  });

  it('day names', () => {
    expect(dayName('2024-06-01', '2024-06-01')).toBe('Today');
    expect(dayName('2024-06-02', '2024-06-01')).toBe('Tomorrow');
    expect(dayName('2024-06-04', '2024-06-01')).toBe('Tue 06/04');
    expect(dayName('2024-07-01', '2024-06-30')).toBe('Tomorrow'); // month change
  });

  it('celsius to fahrenheit', () => {
    expect(temperature(0, 'F')).toBe(32);
    expect(temperature(36.6, 'F')).toBe(98);
    expect(temperature(21.4, 'C')).toBe(21);
  });

  it('wind direction', () => {
    expect(windDirection(0)).toBe('N');
    expect(windDirection(90)).toBe('E');
    expect(windDirection(350)).toBe('N');
  });

  it('screen background', () => {
    expect(backgroundFor('01d')).toBe('clear');
    expect(backgroundFor('10d')).toBe('rain');
    expect(backgroundFor('10n')).toBe('night');
  });
});
