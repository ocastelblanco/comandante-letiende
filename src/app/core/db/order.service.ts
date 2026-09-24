import { computed, inject, Injectable, signal } from '@angular/core';
import {
  addDoc,
  collection,
  doc,
  Firestore,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  QuerySnapshot,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Order, OrderStatus, PaymentMethod } from '../models/order.model';
import { OrderItem } from '../models/order-item.model';
import { computeOrderTotals } from '../models/order-totals';
import { connectWhileAuthenticated } from './live-listener';
import { RealtimeStatusService } from './realtime-status.service';
import { ResilientListener } from './resilient-listener';

// Propina sugerida por defecto al crear un pedido — editable por el mesero
// más adelante (Tarea 31), tanto en porcentaje como en valor absoluto.
const DEFAULT_TIP_PERCENTAGE = 10;

// Ventana de la pestaña "Entregados" del administrador.
const RECENT_DELIVERED_WINDOW_MS = 24 * 60 * 60 * 1000;

const byCreatedAt = (a: Order, b: Order): number =>
  (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0);

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(Auth);
  private readonly colRef = collection(this.firestore, 'orders');

  private readonly status = inject(RealtimeStatusService);

  // Pedidos en curso (pendiente / preparando / listo)...
  private readonly _openOrders = signal<Order[]>([]);
  // ...más los ya entregados que todavía no se cobran: siguen activos hasta que se cobren.
  private readonly _deliveredUnpaid = signal<Order[]>([]);
  readonly activeOrders = computed(() =>
    [...this._openOrders(), ...this._deliveredUnpaid()].sort(byCreatedAt),
  );

  constructor() {
    const openQuery = query(
      this.colRef,
      where('status', 'in', ['pending', 'preparing', 'ready']),
    );
    connectWhileAuthenticated<QuerySnapshot>(
      'orders',
      (next, error) => onSnapshot(openQuery, next, error),
      (snap) => this._openOrders.set(this.toOrders(snap).sort(byCreatedAt)),
      () => this._openOrders.set([]),
    );

    // Dos filtros de igualdad: Firestore los resuelve con los índices de campo único,
    // no exige un índice compuesto. Solo trae los entregados pendientes de cobro, no
    // todo el historial (cuota del plan Spark).
    const deliveredUnpaidQuery = query(
      this.colRef,
      where('status', '==', 'delivered'),
      where('paid', '==', false),
    );
    connectWhileAuthenticated<QuerySnapshot>(
      'orders-delivered-unpaid',
      (next, error) => onSnapshot(deliveredUnpaidQuery, next, error),
      (snap) => this._deliveredUnpaid.set(this.toOrders(snap).sort(byCreatedAt)),
      () => this._deliveredUnpaid.set([]),
    );
  }

  /**
   * Escucha los pedidos entregados en las últimas 24 h (más recientes primero). Está pensado
   * para la pestaña "Entregados" del administrador: el listener solo vive mientras esa
   * pestaña está abierta. Devuelve la función que lo cancela.
   *
   * Consulta solo por `deliveredAt` (índice de campo único); un filtro extra por `status`
   * exigiría un índice compuesto, y el CI no despliega índices.
   */
  watchRecentDelivered(onData: (orders: Order[]) => void): () => void {
    const key = 'orders-delivered-recent';
    const cutoff = Timestamp.fromMillis(Date.now() - RECENT_DELIVERED_WINDOW_MS);
    const recentQuery = query(
      this.colRef,
      where('deliveredAt', '>=', cutoff),
      orderBy('deliveredAt', 'desc'),
    );
    const listener = new ResilientListener<QuerySnapshot>(
      (next, error) => onSnapshot(recentQuery, next, error),
      (snap) => onData(this.toOrders(snap)),
      {
        onStatusChange: (down) => this.status.setDown(key, down),
        onError: (error) => console.warn(`[realtime] listener "${key}" falló, se reintentará:`, error),
      },
    );
    this.status.register(key, listener as ResilientListener<unknown>);
    listener.connect();
    return () => {
      listener.disconnect();
      this.status.unregister(key);
    };
  }

  private toOrders(snap: QuerySnapshot): Order[] {
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order);
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
    const payload: Record<string, unknown> = { status, updatedAt: serverTimestamp() };
    if (status === 'delivered') {
      payload['deliveredAt'] = serverTimestamp();
    }
    return updateDoc(doc(this.firestore, 'orders', orderId), payload);
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
      deliveredAt: null,
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
