import { Timestamp } from '@angular/fire/firestore';
import { OrderItem } from './order-item.model';

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  tableNumber: string;
  items: OrderItem[];
  status: OrderStatus;
  paid: boolean;
  waiterId: string;
  waiterName: string;
  total: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
