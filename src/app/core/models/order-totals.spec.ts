import { computeOrderTotals } from './order-totals';

describe('computeOrderTotals', () => {
  it('aplica el 10% por defecto', () => {
    expect(computeOrderTotals(50000, 10, 0)).toEqual({
      subtotal: 50000,
      tipAmount: 5000,
      total: 55000,
    });
  });

  it('redondea la propina porcentual a pesos sin centavos', () => {
    // 33333 * 10 / 100 = 3333.3 -> redondea a 3333
    expect(computeOrderTotals(33333, 10, 0)).toEqual({
      subtotal: 33333,
      tipAmount: 3333,
      total: 36666,
    });
    // 12345 * 15 / 100 = 1851.75 -> redondea a 1852
    expect(computeOrderTotals(12345, 15, 0)).toEqual({
      subtotal: 12345,
      tipAmount: 1852,
      total: 14197,
    });
  });

  it('porcentaje 0 con solo un valor absoluto', () => {
    expect(computeOrderTotals(40000, 0, 6000)).toEqual({
      subtotal: 40000,
      tipAmount: 6000,
      total: 46000,
    });
  });

  it('combina porcentaje y valor absoluto', () => {
    // 20000 * 10 / 100 = 2000, + 1500 = 3500
    expect(computeOrderTotals(20000, 10, 1500)).toEqual({
      subtotal: 20000,
      tipAmount: 3500,
      total: 23500,
    });
  });

  it('subtotal 0 no rompe el cálculo', () => {
    expect(computeOrderTotals(0, 10, 0)).toEqual({
      subtotal: 0,
      tipAmount: 0,
      total: 0,
    });
  });

  it('tipPercentage y tipValue en 0 deja la propina en 0', () => {
    expect(computeOrderTotals(50000, 0, 0)).toEqual({
      subtotal: 50000,
      tipAmount: 0,
      total: 50000,
    });
  });
});
