import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonFab,
  IonFabButton,
  IonFooter,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import { pairwise } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  addCircleOutline,
  addOutline,
  arrowBackOutline,
  removeCircleOutline,
  trashOutline,
} from 'ionicons/icons';
import { OrderService } from '../../core/db/order.service';
import { ProductService } from '../../core/db/product.service';
import { OrderItem } from '../../core/models/order-item.model';
import { Order, OrderStatus } from '../../core/models/order.model';
import { Product } from '../../core/models/product.model';

type View = 'dashboard' | 'new-order';

interface OrderLine {
  id: number;
  query: string;
  filteredProducts: Product[];
  selectedProduct: Product | null;
  quantity: number;
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'warning',
  preparing: 'primary',
  ready: 'success',
  delivered: 'medium',
  cancelled: 'danger',
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  preparing: 'Preparando',
  ready: 'Listo para entregar',
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
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonCardContent,
    IonFab,
    IonFabButton,
    IonList,
    IonListHeader,
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
          <ion-title>Mesero</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-content>
        @if (orderService.activeOrders().length === 0) {
          <div style="padding:48px 24px;text-align:center;opacity:.5">
            <p style="font-size:1rem">No hay pedidos activos.</p>
            <p style="font-size:.875rem;margin-top:4px">Usa el botón + para crear uno.</p>
          </div>
        } @else {
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;padding:12px">
            @for (order of orderService.activeOrders(); track order.id) {
              <ion-card
                button
                (click)="toggleExpand(order.id)"
                style="margin:0;border-left:4px solid"
                [style.border-left-color]="'var(--ion-color-' + statusColors[order.status] + ')'"
              >
                <ion-card-header style="padding:8px 10px 4px">
                  <ion-card-subtitle style="font-size:.65rem;text-transform:uppercase">
                    {{ statusLabels[order.status] }}
                  </ion-card-subtitle>
                  <ion-card-title
                    style="font-size:.95rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"
                  >
                    {{ order.tableNumber }}
                  </ion-card-title>
                </ion-card-header>

                <ion-card-content style="padding:4px 10px 10px">
                  @if (expandedOrderId() === order.id) {
                    @for (item of order.items; track item.productId) {
                      <div
                        style="display:flex;justify-content:space-between;font-size:.8rem;padding:2px 0"
                        [style.opacity]="item.itemStatus === 'ready' ? '1' : '.6'"
                      >
                        <span>
                          @if (item.itemStatus === 'ready') { ✓&nbsp; }
                          {{ item.productName }} ×{{ item.quantity }}
                        </span>
                      </div>
                    }
                    <div
                      style="border-top:1px solid var(--ion-color-light);margin-top:6px;padding-top:4px;font-size:.8rem;font-weight:700"
                    >
                      $ {{ order.total | number : '1.0-0' }}
                    </div>
                  } @else {
                    <div style="font-size:.8rem;opacity:.7">
                      {{ order.items.length }} ítem{{ order.items.length !== 1 ? 's' : '' }}
                      · $ {{ order.total | number : '1.0-0' }}
                    </div>
                  }
                </ion-card-content>
              </ion-card>
            }
          </div>
        }
      </ion-content>

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button (click)="openNewOrder()">
          <ion-icon name="add-outline" />
        </ion-fab-button>
      </ion-fab>
    } @else {
      <!-- ── Nuevo pedido ────────────────────────────────────────────────── -->
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-button fill="clear" (click)="cancelNewOrder()">
              <ion-icon slot="icon-only" name="arrow-back-outline" />
            </ion-button>
          </ion-buttons>
          <ion-title>Nuevo pedido</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-content>
        <!-- Identificador -->
        <ion-item>
          <ion-label position="stacked">Identificador del pedido *</ion-label>
          <ion-input
            [value]="orderIdentifier()"
            (ionInput)="onIdentifierInput($event)"
            placeholder="Ej: Mesa 3, Juan"
            clearInput
          />
        </ion-item>

        <!-- Líneas de productos -->
        <div style="padding:8px 0">
          @for (line of orderLines(); track line.id) {
            @if (line.selectedProduct) {
              <!-- Tarjeta de producto seleccionado -->
              <div
                style="display:flex;align-items:center;gap:6px;padding:8px 12px;margin:4px 12px;background:var(--ion-color-light);border-radius:10px"
              >
                <div style="flex:1;min-width:0">
                  <div
                    style="font-weight:600;font-size:.9rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
                  >
                    {{ line.selectedProduct.name }}
                  </div>
                  <div style="font-size:.75rem;opacity:.65">
                    $ {{ line.selectedProduct.totalPrice | number : '1.0-0' }} × {{ line.quantity }}
                    = $ {{ line.selectedProduct.totalPrice * line.quantity | number : '1.0-0' }}
                  </div>
                </div>
                <ion-button
                  fill="clear"
                  size="small"
                  [disabled]="line.quantity <= 1"
                  (click)="decrementLine(line.id)"
                >
                  <ion-icon slot="icon-only" name="remove-circle-outline" />
                </ion-button>
                <span style="min-width:1.2rem;text-align:center;font-weight:700">
                  {{ line.quantity }}
                </span>
                <ion-button fill="clear" size="small" (click)="incrementLine(line.id)">
                  <ion-icon slot="icon-only" name="add-circle-outline" />
                </ion-button>
                <ion-button
                  fill="clear"
                  size="small"
                  color="danger"
                  (click)="removeLine(line.id)"
                >
                  <ion-icon slot="icon-only" name="trash-outline" />
                </ion-button>
              </div>
            } @else {
              <!-- Autocompletar -->
              <div style="margin:4px 12px">
                <ion-item>
                  <ion-input
                    [value]="line.query"
                    (ionInput)="filterLine(line.id, $event)"
                    placeholder="Buscar producto..."
                    clearInput
                  />
                  <ion-button
                    fill="clear"
                    slot="end"
                    color="danger"
                    (click)="removeLine(line.id)"
                  >
                    <ion-icon slot="icon-only" name="trash-outline" />
                  </ion-button>
                </ion-item>
                @if (line.filteredProducts.length > 0) {
                  <ion-list
                    style="border:1px solid var(--ion-color-medium-tint);border-radius:8px;margin-top:2px;overflow:hidden"
                  >
                    @for (p of line.filteredProducts; track p.id) {
                      <ion-item
                        button
                        lines="full"
                        style="--min-height:40px"
                        (click)="selectProduct(line.id, p)"
                      >
                        <ion-label style="font-size:.875rem">
                          {{ p.name }}
                          <span style="opacity:.6"> — $ {{ p.totalPrice | number : '1.0-0' }}</span>
                        </ion-label>
                      </ion-item>
                    }
                  </ion-list>
                }
              </div>
            }
          }
        </div>

        <!-- Botón añadir producto -->
        <div style="padding:4px 12px">
          <ion-button expand="block" fill="outline" (click)="addLine()">
            <ion-icon slot="start" name="add-circle-outline" />
            Añadir producto
          </ion-button>
        </div>

        <!-- Resumen discriminado -->
        @if (hasSelectedProducts()) {
          <div
            style="margin:16px 12px 80px;border:1px solid var(--ion-color-light-shade);border-radius:10px;overflow:hidden"
          >
            <ion-list-header style="--background:var(--ion-color-light)">
              <ion-label>Resumen</ion-label>
            </ion-list-header>
            @for (line of orderLines(); track line.id) {
              @if (line.selectedProduct) {
                <div style="padding:6px 16px">
                  <div style="display:flex;justify-content:space-between;font-size:.875rem">
                    <span>{{ line.selectedProduct.name }} ×{{ line.quantity }}</span>
                    <span>
                      $ {{ line.selectedProduct.totalPrice * line.quantity | number : '1.0-0' }}
                    </span>
                  </div>
                  <div
                    style="display:flex;justify-content:space-between;font-size:.75rem;opacity:.55;padding-left:8px"
                  >
                    <span>Base + propina</span>
                    <span>
                      $ {{ line.selectedProduct.basePrice * line.quantity | number : '1.0-0' }}
                      + $ {{ line.selectedProduct.tipAmount * line.quantity | number : '1.0-0' }}
                    </span>
                  </div>
                </div>
              }
            }
            <div
              style="display:flex;justify-content:space-between;padding:10px 16px;font-weight:700;background:var(--ion-color-light);border-top:1px solid var(--ion-color-medium-tint)"
            >
              <span>Total a cobrar</span>
              <span>$ {{ orderTotal() | number : '1.0-0' }}</span>
            </div>
          </div>
        }
      </ion-content>

      <ion-footer>
        <ion-toolbar>
          @if (submitError()) {
            <ion-note
              color="danger"
              style="display:block;padding:4px 16px;font-size:.85rem;text-align:center"
            >
              {{ submitError() }}
            </ion-note>
          }
          <div style="padding:8px 16px">
            <ion-button expand="block" [disabled]="!canSubmit()" (click)="submitOrder()">
              @if (submitting()) {
                <ion-spinner name="crescent" />
              } @else {
                Realizar pedido · $ {{ orderTotal() | number : '1.0-0' }}
              }
            </ion-button>
          </div>
        </ion-toolbar>
      </ion-footer>
    }
  `,
})
export class WaiterComponent {
  readonly orderService = inject(OrderService);
  private readonly productService = inject(ProductService);
  private readonly toastCtrl = inject(ToastController);

  readonly statusColors = STATUS_COLORS;
  readonly statusLabels = STATUS_LABELS;

  // ── Dashboard ────────────────────────────────────────────────────────────
  view = signal<View>('dashboard');
  expandedOrderId = signal<string | null>(null);

  // ── New-order form ────────────────────────────────────────────────────────
  orderIdentifier = signal('');
  private lineCounter = 0;
  private readonly _orderLines = signal<OrderLine[]>([]);
  readonly orderLines = this._orderLines.asReadonly();

  submitting = signal(false);
  submitError = signal('');

  readonly hasSelectedProducts = computed(() =>
    this._orderLines().some((l) => l.selectedProduct !== null),
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
    addIcons({ addOutline, addCircleOutline, removeCircleOutline, trashOutline, arrowBackOutline });

    // Notificar al mesero cuando un ítem pase a estado 'ready'
    toObservable(this.orderService.activeOrders)
      .pipe(pairwise(), takeUntilDestroyed())
      .subscribe(([prev, curr]: [Order[], Order[]]) => {
        const prevReady = new Set(
          prev.flatMap((o) =>
            o.items.map((item, i) =>
              item.itemStatus === 'ready' ? `${o.id}:${i}` : null,
            ),
          ).filter((k): k is string => k !== null),
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
    } catch {
      this.submitError.set('No se pudo crear el pedido. Intenta de nuevo.');
    } finally {
      this.submitting.set(false);
    }
  }
}
