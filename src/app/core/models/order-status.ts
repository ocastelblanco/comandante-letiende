import { Order, OrderStatus } from './order.model';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  preparing: 'Preparando',
  ready: 'Lista',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

/** Un pedido entregado pero sin cobrar sigue "activo": hay que cobrarlo. */
export function isDeliveredUnpaid(order: Pick<Order, 'status' | 'paid'>): boolean {
  return order.status === 'delivered' && !order.paid;
}

/**
 * Color del `border-left` de las tarjetas de pedido del administrador. Los pedidos
 * listos o entregados que aún no se cobran se resaltan con `--ion-color-secondary`,
 * el mismo color de los que están en preparación.
 */
export function orderBorderColor(order: Pick<Order, 'status' | 'paid'>): string {
  if ((order.status === 'ready' || order.status === 'delivered') && !order.paid) {
    return 'var(--ion-color-secondary)';
  }
  switch (order.status) {
    case 'preparing':
      return 'var(--ion-color-secondary)';
    case 'ready':
      return 'var(--ion-color-tertiary)';
    case 'delivered':
      return 'var(--ion-color-medium)';
    default:
      return 'var(--ion-color-light)';
  }
}

/** Color del chip de estado (fondo). */
export function orderStatusColor(status: OrderStatus): string {
  return orderBorderColor({ status, paid: true });
}
