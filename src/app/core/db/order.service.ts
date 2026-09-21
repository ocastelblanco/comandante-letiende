import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import {
  addDoc,
  collection,
  doc,
  Firestore,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Order, OrderStatus, PaymentMethod } from '../models/order.model';
import { OrderItem } from '../models/order-item.model';
import { computeOrderTotals } from '../models/order-totals';

// Propina sugerida por defecto al crear un pedido — editable por el mesero
// más adelante (Tarea 31), tanto en porcentaje como en valor absoluto.
const DEFAULT_TIP_PERCENTAGE = 10;

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

  markOrderPaid(orderId: string, paymentMethod: PaymentMethod): Promise<void> {
    return updateDoc(doc(this.firestore, 'orders', orderId), {
      paid: true,
      paymentMethod,
      paidAt: serverTimestamp(),
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

  async getOrdersByRange(start: Date, end: Date): Promise<Order[]> {
    const q = query(
      this.colRef,
      where('paid', '==', true),
      where('paidAt', '>=', Timestamp.fromDate(start)),
      where('paidAt', '<=', Timestamp.fromDate(end)),
      orderBy('paidAt', 'asc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order);
  }

  createOrder(
    tableNumber: string,
    items: OrderItem[],
    observations = '',
    tipPercentage = DEFAULT_TIP_PERCENTAGE,
    tipValue = 0,
  ): Promise<unknown> {
    const user = this.auth.currentUser;
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const { tipAmount, total } = computeOrderTotals(subtotal, tipPercentage, tipValue);
    return addDoc(this.colRef, {
      tableNumber,
      items,
      status: 'pending' as OrderStatus,
      paid: false,
      paymentMethod: null,
      paidAt: null,
      waiterId: user?.email ?? '',
      waiterName: user?.displayName ?? '',
      observations,
      subtotal,
      tipPercentage,
      tipValue,
      tipAmount,
      total,
      baristaId: null,
      preparedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  updateOrderTip(
    orderId: string,
    tip: { tipPercentage: number; tipValue: number; tipAmount: number; total: number },
  ): Promise<void> {
    return updateDoc(doc(this.firestore, 'orders', orderId), {
      ...tip,
      updatedAt: serverTimestamp(),
    });
  }
}
