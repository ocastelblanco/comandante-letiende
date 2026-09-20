import { Timestamp } from '@angular/fire/firestore';
import { OrderItem } from './order-item.model';

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type PaymentMethod = 'card' | 'cash' | 'nequi' | 'daviplata';

export interface Order {
  id: string;
  tableNumber: string;
  items: OrderItem[];
  status: OrderStatus;
  paid: boolean;
  paymentMethod: PaymentMethod | null;
  paidAt: Timestamp | null;
  waiterId: string;
  waiterName: string;
  // Observaciones del mesero dirigidas al barista (y visibles para el
  // administrador). '' si no se escribió ninguna.
  observations: string;
  // Suma de unitPrice * quantity de todos los ítems, SIN propina.
  subtotal: number;
  // Porcentaje sugerido sobre el subtotal. 10 por defecto.
  tipPercentage: number;
  // Valor absoluto adicional sobre la propina porcentual. 0 por defecto.
  tipValue: number;
  // Propina final = Math.round(subtotal * tipPercentage / 100) + tipValue.
  // El peso colombiano no maneja centavos, de ahí el redondeo.
  tipAmount: number;
  // total = subtotal + tipAmount. Es el valor a cobrar.
  total: number;
  // Se escriben en OrderService.updateOrderStatusAsBarista() al marcar
  // 'ready'; declarados aquí para que dejen de ser un campo fantasma.
  baristaId: string | null;
  preparedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
