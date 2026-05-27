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
  total: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
