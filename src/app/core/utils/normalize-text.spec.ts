import { normalizeText } from './normalize-text';

describe('normalizeText', () => {
  it('quita tildes', () => {
    expect(normalizeText('Mítica')).toBe('mitica');
    expect(normalizeText('Café Ámbar')).toBe('cafe ambar');
  });

  it('quita diéresis', () => {
    expect(normalizeText('Pingüino')).toBe('pinguino');
  });

  it('convierte ñ en n', () => {
    expect(normalizeText('Año')).toBe('ano');
    expect(normalizeText('PIÑA')).toBe('pina');
  });

  it('no distingue mayúsculas', () => {
    expect(normalizeText('MÍTICA')).toBe(normalizeText('mítica'));
  });

  it('colapsa y recorta espacios', () => {
    expect(normalizeText('  Agua   con  gas ')).toBe('agua con gas');
  });

  it('permite buscar sin tildes un nombre que sí las tiene', () => {
    expect(normalizeText('Mítica').includes(normalizeText('mit'))).toBe(true);
    expect(normalizeText('Mítica').includes(normalizeText('mistica'))).toBe(false);
    expect(normalizeText('Limón').includes(normalizeText('limon'))).toBe(true);
  });
});
