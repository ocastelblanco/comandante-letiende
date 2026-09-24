import { Component, computed, effect, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  ActionSheetController,
  IonButton,
  IonButtons,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  bagCheckOutline,
  checkmarkCircleOutline,
  flameOutline,
  listOutline,
  personCircleOutline,
  timeOutline,
} from 'ionicons/icons';
import { AuthService } from '../../../core/auth/auth.service';
import { OrderService } from '../../../core/db/order.service';
import { Order, OrderStatus, PaymentMethod } from '../../../core/models/order.model';
import {
  isDeliveredUnpaid,
  orderBorderColor,
  orderStatusColor,
  ORDER_STATUS_LABELS,
} from '../../../core/models/order-status';
import { PAYMENT_METHODS } from '../../../core/models/payment-methods';
import { OrderItem } from '../../../core/models/order-item.model';

type FilterTab = 'all' | 'pending' | 'preparing' | 'ready' | 'delivered';
type DeliveredFilter = 'all' | 'paid' | 'unpaid';

const DELIVERED_FILTERS: { value: DeliveredFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'paid', label: 'Cobrados' },
  { value: 'unpaid', label: 'Sin cobrar' },
];

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [
    DecimalPipe,
    IonButton,
    IonButtons,
    IonChip,
    IonContent,
    IonHeader,
    IonIcon,
    IonLabel,
    IonSegment,
    IonSegmentButton,
    IonTitle,
    IonToolbar,
  ],
  styles: [`
    @media (min-width: 1024px) { ion-header { display: none; } }
  `],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <img slot="start" src="/logo_blanco_sin_fondo.svg" alt="Le Tiende" width="55" height="24"
             style="height:24px;margin-left:16px">
        <ion-title class="text-center">Pedidos</ion-title>
        <ion-buttons slot="end">
          @if (photoURL()) {
            <img [src]="photoURL()!" alt="avatar" referrerpolicy="no-referrer"
                 style="width:32px;height:32px;border-radius:50%;object-fit:cover;
                        margin-right:12px;border:2px solid rgba(var(--ion-color-primary-contrast-rgb),.5)">
          } @else {
            <ion-button fill="clear">
              <ion-icon slot="icon-only" name="person-circle-outline"
                        style="font-size:1.6rem;color:var(--ion-color-primary-contrast)" />
            </ion-button>
          }
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="p-4 lg:p-8 max-w-3xl mx-auto">

        <!-- Desktop page header -->
        <div class="hidden lg:flex items-center gap-3 mb-6">
          <h1 class="flex-1 text-2xl font-bold text-espresso">Pedidos en curso</h1>
          <span class="w-2 h-2 rounded-full bg-teal animate-pulse"></span>
          <span class="text-xs text-espresso/70 font-medium">En tiempo real</span>
        </div>

        <!-- Filter segment -->
        <ion-segment [value]="activeTab()" (ionChange)="onTabChange($event)"
                     style="--background:white;
                            box-shadow:0 1px 3px rgba(35,12,0,0.08);
                            border-radius:16px;
                            padding:4px;
                            margin-bottom:16px">
          @for (tab of tabs; track tab.value) {
            <ion-segment-button [value]="tab.value"
                                style="--color:rgba(35,12,0,0.5);
                                       --color-checked:var(--ion-color-primary-contrast);
                                       --background-checked:var(--ion-color-primary);
                                       --indicator-color:transparent;
                                       --indicator-height:0;
                                       --border-radius:12px;
                                       --min-width:0">
              <ion-icon [name]="tab.icon" class="lg:hidden" style="font-size:1.3rem;margin:0" />
              <ion-label class="hidden lg:block">
                {{ tab.label }}
                @if (tab.count() > 0) {
                  <span style="opacity:.6;font-size:.7rem">({{ tab.count() }}{{ tab.suffix }})</span>
                }
              </ion-label>
            </ion-segment-button>
          }
        </ion-segment>

        <!-- Active filter label — mobile only -->
        <p class="lg:hidden text-sm font-semibold text-espresso mb-3 px-1">
          {{ activeTabLabel() }}
        </p>

        <!-- Entregados: últimas 24 h, con filtro por estado de cobro -->
        @if (activeTab() === 'delivered') {
          <div class="flex flex-wrap items-center gap-2 mb-4">
            @for (f of deliveredFilters; track f.value) {
              <ion-chip (click)="deliveredFilter.set(f.value)"
                        [style.--background]="deliveredFilter() === f.value ? 'var(--ion-color-primary)' : 'var(--color-cream)'"
                        [style.--color]="deliveredFilter() === f.value ? 'var(--ion-color-primary-contrast)' : 'var(--color-espresso)'"
                        style="margin:0;padding-left:8px;padding-right:8px;font-weight:600;font-size:.8rem;cursor:pointer">
                {{ f.label }}
              </ion-chip>
            }
            <span class="text-xs text-espresso/60 ml-1">Últimas 24 horas</span>
          </div>
        }

        <!-- Orders list -->
        @if (filteredOrders().length === 0) {
          <div class="bg-white rounded-2xl p-12 text-center
                      shadow-[0_1px_3px_rgba(35,12,0,0.08)]">
            <p class="text-espresso/64 text-sm">
              {{ activeTab() === 'delivered' ? 'No hay pedidos entregados para este filtro.' : 'No hay pedidos en este estado.' }}
            </p>
          </div>
        } @else {
          <div class="flex flex-col gap-3">
            @for (order of filteredOrders(); track order.id) {
              <div class="bg-white rounded-2xl shadow-[0_1px_3px_rgba(35,12,0,0.12)] overflow-hidden"
                   [style.border-left]="'4px solid ' + borderColor(order)">
                <div class="p-4">
                  <!-- Header row -->
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="text-base font-bold text-espresso">
                          Pedido: {{ order.tableNumber }}
                        </span>
                        <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide"
                              [style.background]="statusColor(order.status)"
                              [style.color]="order.status === 'delivered' ? '#fff' : 'var(--ion-color-primary)'">
                          {{ statusLabel(order.status) }}
                        </span>
                        @if (order.paid) {
                          <span style="font-size:.625rem;font-weight:700;padding:2px 8px;
                                       border-radius:9999px;text-transform:uppercase;letter-spacing:.05em;
                                       background:rgba(0,183,163,.15);color:var(--ion-color-tertiary)">Pagado</span>
                        } @else {
                          <span style="font-size:.625rem;font-weight:700;padding:2px 8px;
                                       border-radius:9999px;text-transform:uppercase;letter-spacing:.05em;
                                       background:rgba(232,99,10,.12);color:var(--ion-color-secondary)">Sin cobrar</span>
                        }
                      </div>
                      <p class="text-xs text-espresso/70 mt-0.5">
                        Mesero: {{ order.waiterName }}
                      </p>
                    </div>
                    <p class="text-lg font-bold text-espresso shrink-0">
                      &#36;{{ order.total | number:'1.0-0' }}
                    </p>
                  </div>

                  <!-- Items chips -->
                  <div class="mt-3 flex flex-wrap gap-1.5">
                    @for (item of order.items; track item.productId) {
                      <span class="bg-cream text-espresso text-xs font-medium
                                   px-2.5 py-1 rounded-full">
                        {{ itemLabel(item) }}
                      </span>
                    }
                  </div>

                  <!-- Observaciones del mesero para el barista/administrador -->
                  @if (order.observations) {
                    <div class="mt-3 bg-cream/50 rounded-xl px-3 py-2 flex gap-2 items-start">
                      <span style="font-size:.9rem;line-height:1.2">📝</span>
                      <p class="text-xs text-espresso/70 italic">{{ order.observations }}</p>
                    </div>
                  }

                  <!-- Action button -->
                  <div class="mt-4">
                    @if (order.status === 'pending') {
                      <ion-button expand="block" color="secondary" class="btn-rounded"
                                  (click)="updateStatus(order, 'preparing')">
                        Marcar como preparando
                      </ion-button>
                    } @else if (order.status === 'preparing') {
                      <ion-button expand="block" color="tertiary" class="btn-rounded"
                                  (click)="updateStatus(order, 'ready')">
                        Marcar como lista ✓
                      </ion-button>
                    } @else if (order.status === 'ready') {
                      <ion-button expand="block" fill="outline" class="btn-rounded"
                                  style="--color:rgba(var(--ion-color-primary-rgb),0.45);--border-color:rgba(var(--ion-color-primary-rgb),0.12)"
                                  (click)="updateStatus(order, 'delivered')">
                        Marcar como entregada
                      </ion-button>
                    }
                    @if (isDeliveredUnpaid(order)) {
                      <!-- Flujo excepcional: lo normal es que cobre el mesero -->
                      <ion-button expand="block" color="secondary" class="btn-rounded"
                                  (click)="charge(order)">
                        Cobrar pedido
                      </ion-button>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        }

      </div>
    </ion-content>
  `,
})
export class AdminOrdersComponent {
  private auth = inject(AuthService);
  private orderService = inject(OrderService);
  private actionSheetCtrl = inject(ActionSheetController);

  protected readonly photoURL = computed(() => this.auth.currentUser()?.photoURL ?? null);
  protected readonly orders = this.orderService.activeOrders;
  protected readonly activeTab = signal<FilterTab>('all');

  protected readonly deliveredFilters = DELIVERED_FILTERS;
  protected readonly deliveredFilter = signal<DeliveredFilter>('all');
  protected readonly isDeliveredUnpaid = isDeliveredUnpaid;

  // Entregados de las últimas 24 h. El listener solo existe mientras la pestaña
  // "Entregados" está abierta (cuota del plan Spark): se cancela al salir de ella.
  private readonly recentDelivered = signal<Order[]>([]);

  protected readonly tabs = [
    { value: 'all' as FilterTab, label: 'Todos', icon: 'list-outline', suffix: '', count: computed(() => this.orders().length) },
    { value: 'pending' as FilterTab, label: 'Pendientes', icon: 'time-outline', suffix: '', count: computed(() => this.orders().filter(o => o.status === 'pending').length) },
    { value: 'preparing' as FilterTab, label: 'Preparando', icon: 'flame-outline', suffix: '', count: computed(() => this.orders().filter(o => o.status === 'preparing').length) },
    { value: 'ready' as FilterTab, label: 'Listos', icon: 'checkmark-circle-outline', suffix: '', count: computed(() => this.orders().filter(o => o.status === 'ready').length) },
    // El contador de esta pestaña son los entregados SIN COBRAR (ya están en memoria);
    // la lista completa de 24 h solo se carga al abrirla.
    { value: 'delivered' as FilterTab, label: 'Entregados', icon: 'bag-check-outline', suffix: ' sin cobrar', count: computed(() => this.orders().filter(isDeliveredUnpaid).length) },
  ];

  protected readonly activeTabLabel = computed(() =>
    this.tabs.find(t => t.value === this.activeTab())?.label ?? '',
  );

  // Últimas 24 h + los entregados sin cobrar de cualquier antigüedad (siguen requiriendo
  // acción, por eso no se ocultan al pasar las 24 h). Sin duplicados, más recientes primero.
  private readonly deliveredOrders = computed(() => {
    const byId = new Map<string, Order>();
    for (const o of this.recentDelivered()) byId.set(o.id, o);
    for (const o of this.orders()) if (isDeliveredUnpaid(o)) byId.set(o.id, o);
    const time = (o: Order) => (o.deliveredAt ?? o.updatedAt ?? o.createdAt)?.seconds ?? 0;
    return [...byId.values()].sort((a, b) => time(b) - time(a));
  });

  protected readonly filteredOrders = computed(() => {
    const tab = this.activeTab();
    if (tab === 'all') return this.orders();
    if (tab === 'delivered') {
      const filter = this.deliveredFilter();
      return this.deliveredOrders().filter((o) =>
        filter === 'all' ? true : filter === 'paid' ? o.paid : !o.paid,
      );
    }
    return this.orders().filter(o => o.status === tab);
  });

  constructor() {
    addIcons({ bagCheckOutline, checkmarkCircleOutline, flameOutline, listOutline, personCircleOutline, timeOutline });

    effect((onCleanup) => {
      if (this.activeTab() !== 'delivered') {
        this.recentDelivered.set([]);
        return;
      }
      const stop = this.orderService.watchRecentDelivered((orders) => this.recentDelivered.set(orders));
      onCleanup(stop);
    });
  }

  onTabChange(ev: Event): void {
    this.activeTab.set((ev as CustomEvent).detail.value as FilterTab);
  }

  protected borderColor(order: Order): string {
    return orderBorderColor(order);
  }
  protected statusColor(s: OrderStatus): string {
    return orderStatusColor(s);
  }
  protected statusLabel(s: OrderStatus): string {
    return ORDER_STATUS_LABELS[s];
  }

  // Arma el texto de la chip incluyendo variante y adiciones cuando existan,
  // igual que en la vista de barista, para que el administrador vea el
  // detalle completo del ítem sin abrir el pedido.
  protected itemLabel(item: OrderItem): string {
    let label = `${item.quantity}× ${item.productName}`;
    if (item.variant) {
      label += ` (${item.variant})`;
    }
    if (item.additions.length > 0) {
      label += ' ' + item.additions.map(a => `+ ${a.addition}`).join(', ');
    }
    return label;
  }

  async updateStatus(order: Order, status: OrderStatus): Promise<void> {
    await this.orderService.updateOrderStatus(order.id, status);
  }

  // Cobro por parte del administrador: caso extraordinario (p. ej. el mesero no está).
  async charge(order: Order): Promise<void> {
    const sheet = await this.actionSheetCtrl.create({
      header: `Medio de pago · ${order.tableNumber}`,
      buttons: [
        ...PAYMENT_METHODS.map((m) => ({
          text: m.label,
          icon: m.icon,
          data: { method: m.value as PaymentMethod },
        })),
        { text: 'Cancelar', role: 'cancel' },
      ],
    });
    await sheet.present();
    const { data, role } = await sheet.onWillDismiss<{ method: PaymentMethod }>();
    if (role === 'cancel' || !data) return;
    await this.orderService.markOrderPaid(order.id, data.method);
  }
}
