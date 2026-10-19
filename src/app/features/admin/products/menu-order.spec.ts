import { describe, expect, it } from 'vitest';
import { sortMenuItems } from '../../../../../functions/src/menu-order';

describe('sortMenuItems', () => {
  it('ordena ascendente por order', () => {
    const r = sortMenuItems([
      { name: 'C', order: 3 },
      { name: 'A', order: 1 },
      { name: 'B', order: 2 },
    ]);
    expect(r.map((i) => i.name)).toEqual(['A', 'B', 'C']);
  });

  it('deja los null al final con desempate estable por nombre', () => {
    const r = sortMenuItems([
      { name: 'Zeta', order: null },
      { name: 'Alfa', order: null },
      { name: 'Medio', order: 5 },
    ]);
    expect(r.map((i) => i.name)).toEqual(['Medio', 'Alfa', 'Zeta']);
  });

  it('desempata por nombre cuando el order es igual y no muta la entrada', () => {
    const entrada = [
      { name: 'B', order: 1 },
      { name: 'A', order: 1 },
    ];
    expect(sortMenuItems(entrada).map((i) => i.name)).toEqual(['A', 'B']);
    expect(entrada[0].name).toBe('B');
  });
});
