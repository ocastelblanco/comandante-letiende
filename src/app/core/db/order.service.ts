import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import {
  addDoc,
  collection,
  doc,
  Firestore,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
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

  private readonly _activeOrders = signal<Order[]>([]);
  readonly activeOrders = this._activeOrders.asReadonly();

  constructor() {
    const q = query(
      this.colRef,
      where('status', 'in', ['pending', 'preparing', 'ready']),
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const orders = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as Order)
        .sort((a, b) => (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0));
      this._activeOrders.set(orders);
    });
    inject(DestroyRef).onDestroy(unsubscribe);
  }

  markOrderPaid(orderId: string): Promise<void> {
    return updateDoc(doc(this.firestore, 'orders', orderId), {
      paid: true,
      updatedAt: serverTimestamp(),
    });
  }

  updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    return updateDoc(doc(this.firestore, 'orders', orderId), {
      status,
      updatedAt: serverTimestamp(),
    });
  }

  updateOrderStatusAsBarista(orderId: string, status: OrderStatus): Promise<void> {
    const user = this.auth.currentUser;
    const payload: Record<string, unknown> = { status, updatedAt: serverTimestamp() };
    if (status === 'ready') {
      payload['baristaId']  = user?.email ?? '';
      payload['preparedAt'] = serverTimestamp();
    }
    return updateDoc(doc(this.firestore, 'orders', orderId), payload);
  }

  async getOrdersByDate(date: Date): Promise<Order[]> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    const q = query(
      this.colRef,
      where('status', '==', 'delivered'),
      where('createdAt', '>=', Timestamp.fromDate(start)),
      where('createdAt', '<=', Timestamp.fromDate(end)),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order);
  }

  createOrder(tableNumber: string, items: OrderItem[]): Promise<unknown> {
    const user = this.auth.currentUser;
    const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    return addDoc(this.colRef, {
      tableNumber,
      items,
      status: 'pending' as OrderStatus,
      paid: false,
      waiterId: user?.email ?? '',
      waiterName: user?.displayName ?? '',
      total,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}
