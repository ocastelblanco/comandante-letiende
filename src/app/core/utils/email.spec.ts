import { isValidEmail, normalizeEmail } from './email';

describe('normalizeEmail', () => {
  it('quita espacios alrededor y pasa a minúsculas', () => {
    expect(normalizeEmail('  Catalina.Prieto@Gmail.COM ')).toBe('catalina.prieto@gmail.com');
  });
});

describe('isValidEmail', () => {
  it('acepta correos completos', () => {
    expect(isValidEmail('catalina.prieto.s04@gmail.com')).toBe(true);
    expect(isValidEmail('letiende.co@gmail.com')).toBe(true);
    expect(isValidEmail('nombre+extra@empresa.com.co')).toBe(true);
  });

  it('acepta correos con espacios o mayúsculas, porque se normalizan', () => {
    expect(isValidEmail(' Usuario@Gmail.com ')).toBe(true);
  });

  it('rechaza un dominio sin terminación (".com", ".co"...)', () => {
    expect(isValidEmail('catalina.prieto.s04@gmail')).toBe(false);
    expect(isValidEmail('usuario@gmail.')).toBe(false);
    expect(isValidEmail('usuario@gmail.c')).toBe(false);
  });

  it('rechaza correos sin @, sin usuario o con espacios internos', () => {
    expect(isValidEmail('usuario.gmail.com')).toBe(false);
    expect(isValidEmail('@gmail.com')).toBe(false);
    expect(isValidEmail('usu ario@gmail.com')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});
