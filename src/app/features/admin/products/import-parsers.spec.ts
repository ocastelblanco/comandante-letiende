import { buildAdditions, findDuplicate, parseBoolean, parseList, parsePriceList } from './import-parsers';

describe('parseList', () => {
  it('divide una lista separada por comas y recorta espacios', () => {
    expect(parseList('leche_vegetal, licor')).toEqual(['leche_vegetal', 'licor']);
  });

  it('elimina elementos vacíos producidos por comas extra', () => {
    expect(parseList('leche_vegetal,, licor,')).toEqual(['leche_vegetal', 'licor']);
  });

  it('lista vacía y espacios sobrantes retornan []', () => {
    expect(parseList('')).toEqual([]);
    expect(parseList('   ')).toEqual([]);
    expect(parseList(undefined)).toEqual([]);
    expect(parseList(null)).toEqual([]);
  });

  it('un solo elemento sin comas', () => {
    expect(parseList('sin_gas')).toEqual(['sin_gas']);
  });
});

describe('parsePriceList', () => {
  it('parsea una lista de precios separada por comas', () => {
    expect(parsePriceList('3500, 8700')).toEqual([3500, 8700]);
  });

  it('lista vacía retorna []', () => {
    expect(parsePriceList('')).toEqual([]);
    expect(parsePriceList(undefined)).toEqual([]);
  });

  it('valores no numéricos quedan como NaN, sin lanzar', () => {
    const result = parsePriceList('3500, abc');
    expect(result[0]).toBe(3500);
    expect(Number.isNaN(result[1])).toBe(true);
  });
});

describe('parseBoolean', () => {
  it('interpreta el booleano nativo de Excel', () => {
    expect(parseBoolean(true)).toBe(true);
    expect(parseBoolean(false)).toBe(false);
  });

  it('interpreta variantes de texto para verdadero', () => {
    expect(parseBoolean('TRUE')).toBe(true);
    expect(parseBoolean('true')).toBe(true);
    expect(parseBoolean('1')).toBe(true);
    expect(parseBoolean('si')).toBe(true);
    expect(parseBoolean('sí')).toBe(true);
  });

  it('interpreta variantes de texto para falso, incluida la celda vacía', () => {
    expect(parseBoolean('FALSE')).toBe(false);
    expect(parseBoolean('false')).toBe(false);
    expect(parseBoolean('0')).toBe(false);
    expect(parseBoolean('no')).toBe(false);
    expect(parseBoolean(undefined)).toBe(false);
    expect(parseBoolean('')).toBe(false);
  });

  it('un valor no interpretable retorna null', () => {
    expect(parseBoolean('tal vez')).toBeNull();
    expect(parseBoolean('yes')).toBeNull();
  });
});

describe('findDuplicate', () => {
  it('sin duplicados retorna null', () => {
    expect(findDuplicate(['leche_vegetal', 'licor'])).toBeNull();
  });

  it('detecta duplicados exactos', () => {
    expect(findDuplicate(['licor', 'licor'])).toBe('licor');
  });

  it('detecta duplicados insensibles a mayúsculas y espacios', () => {
    expect(findDuplicate(['Licor', ' licor '])).toBe(' licor ');
  });

  it('lista vacía retorna null', () => {
    expect(findDuplicate([])).toBeNull();
  });
});

describe('buildAdditions', () => {
  it('combina nombres y precios en pares', () => {
    expect(buildAdditions(['leche_vegetal', 'licor'], [3500, 8700])).toEqual({
      additions: [
        { addition: 'leche_vegetal', additionPrice: 3500 },
        { addition: 'licor', additionPrice: 8700 },
      ],
      error: null,
    });
  });

  it('listas vacías producen additions vacío sin error', () => {
    expect(buildAdditions([], [])).toEqual({ additions: [], error: null });
  });

  it('rechaza longitudes desiguales entre additions y additionPrices', () => {
    const result = buildAdditions(['leche_vegetal', 'licor'], [3500]);
    expect(result.additions).toEqual([]);
    expect(result.error).toContain('distinta cantidad');
  });

  it('rechaza un precio no finito (NaN de un valor no numérico)', () => {
    const result = buildAdditions(['leche_vegetal'], [NaN]);
    expect(result.additions).toEqual([]);
    expect(result.error).toContain('leche_vegetal');
  });

  it('rechaza un precio negativo', () => {
    const result = buildAdditions(['leche_vegetal'], [-100]);
    expect(result.additions).toEqual([]);
    expect(result.error).toContain('leche_vegetal');
  });

  it('rechaza nombres de adición duplicados', () => {
    const result = buildAdditions(['licor', 'Licor'], [1000, 2000]);
    expect(result.additions).toEqual([]);
    expect(result.error).toContain('duplicada');
  });
});
