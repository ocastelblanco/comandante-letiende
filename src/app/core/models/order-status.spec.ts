import { isDeliveredUnpaid, orderBorderColor, orderStatusColor } from './order-status';

const SECONDARY = 'var(--ion-color-secondary)';

describe('isDeliveredUnpaid', () => {
  it('es cierto solo para entregado y sin cobrar', () => {
    expect(isDeliveredUnpaid({ status: 'delivered', paid: false })).toBe(true);
    expect(isDeliveredUnpaid({ status: 'delivered', paid: true })).toBe(false);
    expect(isDeliveredUnpaid({ status: 'ready', paid: false })).toBe(false);
  });
});

describe('orderBorderColor', () => {
  it('resalta con secondary los listos y entregados sin cobrar', () => {
    expect(orderBorderColor({ status: 'ready', paid: false })).toBe(SECONDARY);
    expect(orderBorderColor({ status: 'delivered', paid: false })).toBe(SECONDARY);
  });

  it('mantiene secondary para los pedidos en preparación', () => {
    expect(orderBorderColor({ status: 'preparing', paid: false })).toBe(SECONDARY);
  });

  it('no resalta los pedidos ya cobrados', () => {
    expect(orderBorderColor({ status: 'ready', paid: true })).toBe('var(--ion-color-tertiary)');
    expect(orderBorderColor({ status: 'delivered', paid: true })).toBe('var(--ion-color-medium)');
  });

  it('deja los pendientes con el color neutro', () => {
    expect(orderBorderColor({ status: 'pending', paid: false })).toBe('var(--ion-color-light)');
  });
});

describe('orderStatusColor', () => {
  it('no depende del estado de cobro', () => {
    expect(orderStatusColor('ready')).toBe('var(--ion-color-tertiary)');
    expect(orderStatusColor('delivered')).toBe('var(--ion-color-medium)');
  });
});
