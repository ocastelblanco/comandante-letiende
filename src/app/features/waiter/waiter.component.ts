import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
  ActionSheetController,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonFab,
  IonFabButton,
  IonFooter,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonNote,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import { Timestamp } from '@angular/fire/firestore';
import { pairwise } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  addCircleOutline,
  addOutline,
  arrowBackOutline,
  closeOutline,
  filterOutline,
  logOutOutline,
  notificationsOutline,
  personCircleOutline,
  removeCircleOutline,
  timeOutline,
  trashOutline,
} from 'ionicons/icons';
import { AuthService } from '../../core/auth/auth.service';
import { OrderService } from '../../core/db/order.service';
import { ProductService } from '../../core/db/product.service';
import { OrderItem } from '../../core/models/order-item.model';
import { Order, OrderStatus, PaymentMethod } from '../../core/models/order.model';
import { Product } from '../../core/models/product.model';

type View = 'dashboard' | 'new-order';

interface OrderLine {
  id: number;
  query: string;
  filteredProducts: Product[];
  selectedProduct: Product | null;
  quantity: number;
}

const STATUS_BADGE: Record<OrderStatus, { bg: string; text: string }> = {
  pending: { bg: '#FFE7B3', text: '#230C00' },
  preparing: { bg: '#E8630A', text: '#230C00' },
  ready: { bg: '#00B7A3', text: '#230C00' },
  delivered: { bg: '#82746c', text: '#ffffff' },
  cancelled: { bg: '#C0392B', text: '#ffffff' },
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  preparing: 'Preparando',
  ready: 'Listo ✓',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

@Component({
  selector: 'app-waiter',
  standalone: true,
  imports: [
    DecimalPipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonCard,
    IonCardContent,
    IonFab,
    IonFabButton,
    IonItem,
    IonLabel,
    IonInput,
    IonNote,
    IonSpinner,
    IonFooter,
  ],
  template: `
    @if (view() === 'dashboard') {
      <!-- ── Dashboard ──────────────────────────────────────────────────── -->
      <ion-header>
        <ion-toolbar>
          <img slot="start" src="/logo_blanco_sin_fondo.svg" alt="Le Tiende" style="height:26px;margin-left:16px">
          <ion-title class="text-center">Comandante</ion-title>
          <ion-buttons slot="end">
            @if (authService.currentUser()?.photoURL; as photoURL) {
              <img [src]="photoURL" alt="avatar" referrerpolicy="no-referrer"
                   (click)="openUserMenu()"
                   style="width:32px;height:32px;border-radius:50%;object-fit:cover;margin-right:12px;border:2px solid rgba(255,231,179,.5);cursor:pointer">
            } @else {
              <ion-button fill="clear" (click)="openUserMenu()">
                <ion-icon slot="icon-only" name="person-circle-outline" style="font-size:1.6rem;color:#FFE7B3" />
              </ion-button>
            }
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content>
        @for (alert of visibleReadyAlerts(); track alert.id) {
          <div style="background:#E8630A;color:#230C00;padding:10px 16px;display:flex;align-items:center;gap:8px">
            <ion-icon name="notifications-outline" style="font-size:1.1rem;flex-shrink:0" />
            <span style="flex:1;font-size:.875rem;font-weight:600">
              ¡"{{ alert.tableNumber }}" listo para entregar!
            </span>
            <ion-button fill="clear" size="small" (click)="dismissAlert(alert.id)" style="--color:#230C00;flex-shrink:0">
              <ion-icon slot="icon-only" name="close-outline" />
            </ion-button>
          </div>
        }

        <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 16px 8px">
          <span style="font-size:1rem;font-weight:700;color:#251a00">
            {{ filterReady() ? 'Listos para entregar' : 'Pedidos Activos' }}
          </span>
          <ion-button fill="clear" size="small" (click)="filterReady.update(v => !v)"
                      [style.--color]="filterReady() ? '#E8630A' : 'rgba(37,26,0,0.4)'">
            <ion-icon slot="icon-only" name="filter-outline" />
          </ion-button>
        </div>

        @if (filteredOrders().length === 0) {
          <div style="padding:48px 24px;text-align:center;opacity:.5">
            @if (filterReady()) {
              <p style="font-size:1rem">No hay pedidos listos aún.</p>
            } @else {
              <p style="font-size:1rem">No hay pedidos activos.</p>
              <p style="font-size:.875rem;margin-top:4px">Usa el botón + para crear uno.</p>
            }
          </div>
        } @else {
          <div style="padding:0 12px 96px;display:flex;flex-direction:column;gap:10px">
            @for (order of filteredOrders(); track order.id) {
              <ion-card button (click)="toggleExpand(order.id)" style="margin:0;border-radius:16px;box-shadow:0 1px 4px rgba(35,12,0,.08)">
                <ion-card-content style="padding:14px 16px">
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
                    <span style="font-size:1rem;font-weight:700;color:#251a00">{{ order.tableNumber }}</span>
                    <div style="display:flex;align-items:center;gap:6px">
                      <span
                        style="padding:4px 12px;border-radius:9999px;font-size:.75rem;font-weight:600;line-height:1"
                        [style.background]="statusBadge[order.status].bg"
                        [style.color]="statusBadge[order.status].text"
                      >{{ statusLabels[order.status] }}</span>
                      @if (order.paid) {
                        <span style="padding:4px 10px;border-radius:9999px;font-size:.7rem;
                                     font-weight:700;line-height:1;
                                     background:rgba(0,183,163,.15);color:#00B7A3">
                          ✓ Pagado
                        </span>
                      } @else {
                        <span (click)="markPaid(order); $event.stopPropagation()"
                              style="padding:4px 10px;border-radius:9999px;font-size:.7rem;
                                     font-weight:700;line-height:1;cursor:pointer;
                                     background:rgba(232,99,10,.12);color:#E8630A">
                          Cobrar
                        </span>
                      }
                    </div>
                  </div>
                  <div style="display:flex;align-items:center;gap:4px;font-size:.8rem;color:#82746c">
                    <ion-icon name="time-outline" style="font-size:.9rem" />
                    <span>{{ timeAgo(order.createdAt) }}</span>
                  </div>
                  @if (expandedOrderId() === order.id) {
                    <div style="margin-top:10px;border-top:1px solid #FFE7B3;padding-top:8px">
                      @for (item of order.items; track item.productId) {
                        <div
                          style="display:flex;justify-content:space-between;font-size:.8rem;padding:2px 0"
                          [style.opacity]="item.itemStatus === 'ready' ? '1' : '.6'"
                        >
                          <span>
                            @if (item.itemStatus === 'ready') { ✓&nbsp; }
                            {{ item.productName }} ×{{ item.quantity }}
                          </span>
                          <span>$ {{ item.unitPrice * item.quantity | number:'1.0-0' }}</span>
                        </div>
                      }
                      <div style="border-top:1px solid rgba(255,231,179,.6);margin:6px 0 4px"></div>
                      <div style="display:flex;justify-content:space-between;font-size:.75rem;color:#82746c;padding:2px 0">
                        <span>Subtotal (base)</span>
                        <span>$ {{ orderSubtotalFor(order) | number:'1.0-0' }}</span>
                      </div>
                      <div style="display:flex;justify-content:space-between;font-size:.75rem;color:#82746c;padding:2px 0">
                        <span>Propina</span>
                        <span>$ {{ orderTipFor(order) | number:'1.0-0' }}</span>
                      </div>
                      <div style="display:flex;justify-content:space-between;font-size:.9rem;font-weight:700;color:#251a00;padding:4px 0 2px">
                        <span>Total</span>
                        <span>$ {{ order.total | number:'1.0-0' }}</span>
                      </div>
                      @if (order.status === 'ready') {
                        <ion-button expand="block" size="small"
                                    (click)="markDelivered(order); $event.stopPropagation()"
                                    style="margin-top:10px;--background:#00B7A3;--color:#230C00;--border-radius:10px">
                          Entregar ✓
                        </ion-button>
                      }
                    </div>
                  } @else {
                    <div style="font-size:.8rem;color:#82746c;margin-top:4px">
                      {{ order.items.length }} ítem{{ order.items.length !== 1 ? 's' : '' }}
                      · $ {{ order.total | number:'1.0-0' }}
                    </div>
                  }
                </ion-card-content>
              </ion-card>
            }
          </div>
        }
      </ion-content>

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button color="secondary" (click)="openNewOrder()">
          <ion-icon name="add-outline" />
        </ion-fab-button>
      </ion-fab>

    } @else {
      <!-- ── Nuevo pedido ────────────────────────────────────────────────── -->
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-button fill="clear" (click)="cancelNewOrder()">
              <ion-icon slot="icon-only" name="arrow-back-outline" style="color:#FFE7B3" />
            </ion-button>
          </ion-buttons>
          <ion-title>Nuevo pedido</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-content>
        <div style="padding:16px 16px 8px">
          <ion-item style="--border-radius:8px">
            <ion-label position="stacked">Identificador del pedido *</ion-label>
            <ion-input
              [value]="orderIdentifier()"
              (ionInput)="onIdentifierInput($event)"
              placeholder="Ej: Mesa 3, Juan"
              clearInput
            />
          </ion-item>
        </div>

        <div style="padding:0 16px">
          @for (line of orderLines(); track line.id) {
            @if (line.selectedProduct) {
              <div style="display:flex;align-items:center;gap:8px;padding:12px 14px;margin-bottom:8px;background:#ffffff;border-radius:16px;box-shadow:0 1px 4px rgba(35,12,0,.08)">
                <div style="flex:1;min-width:0">
                  <div style="font-weight:600;font-size:.9rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#251a00">
                    {{ line.selectedProduct.name }}
                  </div>
                  <div style="font-size:.75rem;color:#82746c;margin-top:2px">
                    $ {{ line.selectedProduct.totalPrice | number:'1.0-0' }} c/u
                  </div>
                </div>
                <div style="display:flex;align-items:center;gap:2px;background:#FFE7B3;border-radius:9999px;padding:2px">
                  <ion-button fill="clear" size="small" [disabled]="line.quantity <= 1" (click)="decrementLine(line.id)">
                    <ion-icon slot="icon-only" name="remove-circle-outline" />
                  </ion-button>
                  <span style="min-width:1.5rem;text-align:center;font-weight:700;font-size:.9rem;color:#230C00">
                    {{ line.quantity }}
                  </span>
                  <ion-button fill="clear" size="small" (click)="incrementLine(line.id)">
                    <ion-icon slot="icon-only" name="add-circle-outline" />
                  </ion-button>
                </div>
                <ion-button fill="clear" size="small" color="danger" (click)="removeLine(line.id)">
                  <ion-icon slot="icon-only" name="trash-outline" />
                </ion-button>
              </div>
            } @else {
              <div style="margin-bottom:8px">
                <ion-item style="--border-radius:8px">
                  <ion-input
                    [value]="line.query"
                    (ionInput)="filterLine(line.id, $event)"
                    placeholder="Buscar producto..."
                    clearInput
                  />
                  <ion-button fill="clear" slot="end" color="danger" (click)="removeLine(line.id)">
                    <ion-icon slot="icon-only" name="trash-outline" />
                  </ion-button>
                </ion-item>
                @if (line.filteredProducts.length > 0) {
                  <div style="background:#ffffff;border-radius:8px;margin-top:4px;overflow:hidden;box-shadow:0 2px 8px rgba(35,12,0,.1)">
                    @for (p of line.filteredProducts; track p.id) {
                      <div
                        style="padding:10px 16px;font-size:.875rem;cursor:pointer;border-bottom:1px solid #FFE7B3"
                        (click)="selectProduct(line.id, p)"
                      >
                        <span style="color:#251a00;font-weight:500">{{ p.name }}</span>
                        <span style="color:#82746c"> — $ {{ p.totalPrice | number:'1.0-0' }}</span>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          }
        </div>

        <div style="padding:4px 16px 8px">
          <ion-button expand="block" fill="outline" (click)="addLine()">
            <ion-icon slot="start" name="add-circle-outline" />
            Añadir producto
          </ion-button>
        </div>

        @if (hasSelectedProducts()) {
          <div style="margin:8px 16px 100px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(35,12,0,.08)">
            <div style="padding:14px 16px 4px;font-size:.75rem;font-weight:600;color:#82746c;letter-spacing:.05em;text-transform:uppercase">
              Resumen
            </div>
            @for (line of orderLines(); track line.id) {
              @if (line.selectedProduct) {
                <div style="display:flex;justify-content:space-between;padding:4px 16px;font-size:.875rem;color:#251a00">
                  <span>{{ line.selectedProduct.name }} ×{{ line.quantity }}</span>
                  <span>$ {{ line.selectedProduct.totalPrice * line.quantity | number:'1.0-0' }}</span>
                </div>
              }
            }
            <div style="border-top:1px solid #FFE7B3;margin:8px 16px 0"></div>
            <div style="display:flex;justify-content:space-between;padding:6px 16px;font-size:.8rem;color:#82746c">
              <span>Subtotal (base)</span>
              <span>$ {{ orderSubtotal() | number:'1.0-0' }}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:6px 16px;font-size:.8rem;color:#82746c">
              <span>Propina</span>
              <span>$ {{ orderTip() | number:'1.0-0' }}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:10px 16px 14px;font-size:1rem;font-weight:700;color:#251a00">
              <span>Total a cobrar</span>
              <span>$ {{ orderTotal() | number:'1.0-0' }}</span>
            </div>
          </div>
        }
      </ion-content>

      <ion-footer>
        <ion-toolbar style="--background:#fff8f1;--border-color:#FFE7B3">
          @if (submitError()) {
            <ion-note color="danger" style="display:block;padding:4px 16px;font-size:.85rem;text-align:center">
              {{ submitError() }}
            </ion-note>
          }
          <div style="padding:8px 16px">
            <ion-button expand="block" color="secondary" [disabled]="!canSubmit()" (click)="submitOrder()">
              @if (submitting()) {
                <ion-spinner name="crescent" />
              } @else {
                Realizar pedido · $ {{ orderTotal() | number:'1.0-0' }}
              }
            </ion-button>
          </div>
        </ion-toolbar>
      </ion-footer>
    }
  `,
})
export class WaiterComponent {
  readonly authService = inject(AuthService);
  readonly orderService = inject(OrderService);
  private readonly productService = inject(ProductService);
  private readonly toastCtrl = inject(ToastController);
  private readonly actionSheetCtrl = inject(ActionSheetController);

  readonly statusBadge = STATUS_BADGE;
  readonly statusLabels = STATUS_LABELS;

  // ── Dashboard ────────────────────────────────────────────────────────────
  view = signal<View>('dashboard');
  expandedOrderId = signal<string | null>(null);
  private readonly dismissedReadyIds = signal<Set<string>>(new Set());

  readonly visibleReadyAlerts = computed(() =>
    this.orderService
      .activeOrders()
      .filter((o) => o.status === 'ready' && !this.dismissedReadyIds().has(o.id)),
  );

  // ── New-order form ────────────────────────────────────────────────────────
  orderIdentifier = signal('');
  private lineCounter = 0;
  private readonly _orderLines = signal<OrderLine[]>([]);
  readonly orderLines = this._orderLines.asReadonly();

  submitting = signal(false);
  submitError = signal('');

  readonly filterReady = signal(false);
  readonly filteredOrders = computed(() =>
    this.filterReady()
      ? this.orderService.activeOrders().filter((o) => o.status === 'ready')
      : this.orderService.activeOrders(),
  );

  readonly hasSelectedProducts = computed(() =>
    this._orderLines().some((l) => l.selectedProduct !== null),
  );

  readonly orderSubtotal = computed(() =>
    this._orderLines()
      .filter((l) => l.selectedProduct)
      .reduce((s, l) => s + l.selectedProduct!.basePrice * l.quantity, 0),
  );

  readonly orderTip = computed(() =>
    this._orderLines()
      .filter((l) => l.selectedProduct)
      .reduce((s, l) => s + l.selectedProduct!.tipAmount * l.quantity, 0),
  );

  readonly orderTotal = computed(() =>
    this._orderLines()
      .filter((l) => l.selectedProduct)
      .reduce((s, l) => s + l.selectedProduct!.totalPrice * l.quantity, 0),
  );

  readonly canSubmit = computed(
    () =>
      this.orderIdentifier().trim().length > 0 &&
      this.hasSelectedProducts() &&
      !this.submitting(),
  );

  constructor() {
    addIcons({
      addOutline,
      addCircleOutline,
      removeCircleOutline,
      trashOutline,
      arrowBackOutline,
      closeOutline,
      filterOutline,
      logOutOutline,
      notificationsOutline,
      personCircleOutline,
      timeOutline,
    });

    toObservable(this.orderService.activeOrders)
      .pipe(pairwise(), takeUntilDestroyed())
      .subscribe(([prev, curr]: [Order[], Order[]]) => {
        const prevReady = new Set(
          prev
            .flatMap((o) =>
              o.items.map((item, i) =>
                item.itemStatus === 'ready' ? `${o.id}:${i}` : null,
              ),
            )
            .filter((k): k is string => k !== null),
        );

        const newlyReady: string[] = [];
        for (const order of curr) {
          for (let i = 0; i < order.items.length; i++) {
            const key = `${order.id}:${i}`;
            if (order.items[i].itemStatus === 'ready' && !prevReady.has(key)) {
              newlyReady.push(`"${order.items[i].productName}" (${order.tableNumber})`);
            }
          }
        }

        if (newlyReady.length > 0) {
          const message =
            newlyReady.length === 1
              ? `Listo para entregar: ${newlyReady[0]}`
              : `${newlyReady.length} ítems listos para entregar`;
          this.toastCtrl
            .create({ message, duration: 6000, position: 'top', color: 'success' })
            .then((t) => t.present());
        }
      });
  }

  // ── Dashboard methods ─────────────────────────────────────────────────────
  toggleExpand(orderId: string): void {
    this.expandedOrderId.update((cur) => (cur === orderId ? null : orderId));
  }

  openNewOrder(): void {
    this._orderLines.set([]);
    this.orderIdentifier.set('');
    this.submitError.set('');
    this.view.set('new-order');
  }

  dismissAlert(id: string): void {
    this.dismissedReadyIds.update((s) => new Set([...s, id]));
  }

  async markDelivered(order: Order): Promise<void> {
    await this.orderService.updateOrderStatus(order.id, 'delivered');
  }

  async openUserMenu(): Promise<void> {
    const sheet = await this.actionSheetCtrl.create({
      header: this.authService.currentUser()?.displayName ?? 'Usuario',
      buttons: [
        {
          text: 'Cerrar sesión',
          role: 'destructive',
          icon: 'log-out-outline',
          handler: () => { void this.authService.signOut(); },
        },
        { text: 'Cancelar', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  async markPaid(order: Order): Promise<void> {
    const sheet = await this.actionSheetCtrl.create({
      header: 'Medio de pago',
      buttons: [
        { text: '💳 Datáfono', data: { method: 'card' as PaymentMethod } },
        { text: '💵 Efectivo', data: { method: 'cash' as PaymentMethod } },
        { text: '📱 Nequi', data: { method: 'nequi' as PaymentMethod } },
        { text: '📱 Daviplata', data: { method: 'daviplata' as PaymentMethod } },
        { text: 'Cancelar', role: 'cancel' },
      ],
    });
    await sheet.present();
    const { data, role } = await sheet.onWillDismiss<{ method: PaymentMethod }>();
    if (role === 'cancel' || !data) return;
    await this.orderService.markOrderPaid(order.id, data.method);
  }

  timeAgo(timestamp: Timestamp): string {
    const mins = Math.floor((Date.now() - timestamp.toDate().getTime()) / 60000);
    if (mins < 1) return 'ahora mismo';
    if (mins < 60) return `hace ${mins} min`;
    return `hace ${Math.floor(mins / 60)} h`;
  }

  orderSubtotalFor(order: Order): number {
    return order.items.reduce((s, item) => s + (item.unitPrice - item.tipAmount) * item.quantity, 0);
  }

  orderTipFor(order: Order): number {
    return order.items.reduce((s, item) => s + item.tipAmount * item.quantity, 0);
  }

  // ── New-order form methods ────────────────────────────────────────────────
  cancelNewOrder(): void {
    this.view.set('dashboard');
  }

  onIdentifierInput(event: Event): void {
    this.orderIdentifier.set(
      (event as CustomEvent<{ value: string | null | undefined }>).detail.value ?? '',
    );
  }

  addLine(): void {
    this._orderLines.update((lines) => [
      ...lines,
      { id: ++this.lineCounter, query: '', filteredProducts: [], selectedProduct: null, quantity: 1 },
    ]);
  }

  removeLine(lineId: number): void {
    this._orderLines.update((lines) => lines.filter((l) => l.id !== lineId));
  }

  filterLine(lineId: number, event: Event): void {
    const query =
      (event as CustomEvent<{ value: string | null | undefined }>).detail.value ?? '';
    const filtered =
      query.trim().length > 0
        ? this.productService
          .activeProducts()
          .filter(
            (p) =>
              p.name.toLowerCase().includes(query.toLowerCase()) ||
              p.category.toLowerCase().includes(query.toLowerCase()),
          )
          .slice(0, 6)
        : [];
    this._orderLines.update((lines) =>
      lines.map((l) => (l.id === lineId ? { ...l, query, filteredProducts: filtered } : l)),
    );
  }

  selectProduct(lineId: number, product: Product): void {
    this._orderLines.update((lines) =>
      lines.map((l) =>
        l.id === lineId
          ? { ...l, selectedProduct: product, query: '', filteredProducts: [] }
          : l,
      ),
    );
  }

  incrementLine(lineId: number): void {
    this._orderLines.update((lines) =>
      lines.map((l) => (l.id === lineId ? { ...l, quantity: l.quantity + 1 } : l)),
    );
  }

  decrementLine(lineId: number): void {
    this._orderLines.update((lines) =>
      lines.map((l) =>
        l.id === lineId && l.quantity > 1 ? { ...l, quantity: l.quantity - 1 } : l,
      ),
    );
  }

  async submitOrder(): Promise<void> {
    const identifier = this.orderIdentifier().trim();
    if (!identifier || !this.hasSelectedProducts()) return;
    this.submitting.set(true);
    this.submitError.set('');
    try {
      const items: OrderItem[] = this._orderLines()
        .filter((l) => l.selectedProduct !== null)
        .map((l) => ({
          productId: l.selectedProduct!.id,
          productName: l.selectedProduct!.name,
          quantity: l.quantity,
          unitPrice: l.selectedProduct!.totalPrice,
          tipAmount: l.selectedProduct!.tipAmount,
          itemStatus: 'pending' as const,
        }));
      await this.orderService.createOrder(identifier, items);
      this.view.set('dashboard');
    } catch (err) {
      console.error('[submitOrder] createOrder failed:', err);
      this.submitError.set('No se pudo crear el pedido. Intenta de nuevo.');
    } finally {
      this.submitting.set(false);
    }
  }
}
