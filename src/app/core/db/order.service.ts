import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import {
  addDoc,
  collection,
  Firestore,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Order, OrderStatus } from '../models/order.model';
import { OrderItem } from '../models/order-item.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(Auth);
  private readonly colRef = collection(this.firestore, 'orders');

  private readonly _pendingOrders = signal<Order[]>([]);
  readonly pendingOrders = this._pendingOrders.asReadonly();

  constructor() {
    const q = query(this.colRef, where('status', 'in', ['pending', 'preparing']));
    const unsubscribe = onSnapshot(q, (snap) => {
      const orders = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as Order)
        .sort((a, b) => (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0));
      this._pendingOrders.set(orders);
    });
    inject(DestroyRef).onDestroy(unsubscribe);
  }

  createOrder(tableNumber: string, items: OrderItem[]): Promise<unknown> {
    const user = this.auth.currentUser;
    const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    return addDoc(this.colRef, {
      tableNumber,
      items,
      status: 'pending' as OrderStatus,
      waiterId: user?.email ?? '',
      waiterName: user?.displayName ?? '',
      total,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}
