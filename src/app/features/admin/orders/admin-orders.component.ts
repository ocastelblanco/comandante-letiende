import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  IonButton,
  IonButtons,
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
  checkmarkCircleOutline,
  flameOutline,
  listOutline,
  personCircleOutline,
  timeOutline,
} from 'ionicons/icons';
import { AuthService } from '../../../core/auth/auth.service';
import { OrderService } from '../../../core/db/order.service';
import { Order, OrderStatus } from '../../../core/models/order.model';

type FilterTab = 'all' | 'pending' | 'preparing' | 'ready';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [
    DecimalPipe,
    IonButton,
    IonButtons,
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
    :host { display: block; height: 100%; }
    @media (min-width: 1024px) { ion-header { display: none; } }
  `],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar style="--background:#230C00;--color:#FFE7B3">
        <img slot="start" src="/logo_blanco_sin_fondo.svg" alt="Le Tiende"
             style="height:24px;margin-left:16px">
        <ion-title class="text-center">Pedidos</ion-title>
        <ion-buttons slot="end">
          @if (photoURL()) {
            <img [src]="photoURL()!" alt="avatar" referrerpolicy="no-referrer"
                 style="width:32px;height:32px;border-radius:50%;object-fit:cover;
                        margin-right:12px;border:2px solid rgba(255,231,179,.5)">
          } @else {
            <ion-button fill="clear">
              <ion-icon slot="icon-only" name="person-circle-outline"
                        style="font-size:1.6rem;color:#FFE7B3" />
            </ion-button>
          }
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="p-4 lg:p-8 max-w-3xl mx-auto">

        <!-- Desktop page header -->
        <div class="hidden lg:flex items-center gap-3 mb-6">
          <h1 class="flex-1 text-2xl font-bold text-[#230C00]">Pedidos en curso</h1>
          <span class="w-2 h-2 rounded-full bg-[#00B7A3] animate-pulse"></span>
          <span class="text-xs text-[#230C00]/45 font-medium">En tiempo real</span>
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
                                       --color-checked:#FFE7B3;
                                       --background-checked:#230C00;
                                       --indicator-color:transparent;
                                       --indicator-height:0;
                                       --border-radius:12px;
                                       --min-width:0">
              <ion-icon [name]="tab.icon" class="lg:hidden" style="font-size:1.3rem;margin:0" />
              <ion-label class="hidden lg:block">
                {{ tab.label }}
                @if (tab.count() > 0) {
                  <span style="opacity:.6;font-size:.7rem">({{ tab.count() }})</span>
                }
              </ion-label>
            </ion-segment-button>
          }
        </ion-segment>

        <!-- Active filter label — mobile only -->
        <p class="lg:hidden text-sm font-semibold text-[#230C00] mb-3 px-1">
          {{ activeTabLabel() }}
        </p>

        <!-- Orders list -->
        @if (filteredOrders().length === 0) {
          <div class="bg-white rounded-2xl p-12 text-center
                      shadow-[0_1px_3px_rgba(35,12,0,0.08)]">
            <p class="text-[#230C00]/35 text-sm">No hay pedidos en este estado.</p>
          </div>
        } @else {
          <div class="flex flex-col gap-3">
            @for (order of filteredOrders(); track order.id) {
              <div class="bg-white rounded-2xl shadow-[0_1px_3px_rgba(35,12,0,0.12)] overflow-hidden"
                   [style.border-left]="'4px solid ' + statusColor(order.status)">
                <div class="p-4">
                  <!-- Header row -->
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="text-base font-bold text-[#230C00]">
                          Mesa {{ order.tableNumber }}
                        </span>
                        <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide"
                              [style.background]="statusColor(order.status)"
                              style="color:#230C00">
                          {{ statusLabel(order.status) }}
                        </span>
                      </div>
                      <p class="text-xs text-[#230C00]/45 mt-0.5">
                        Mesero: {{ order.waiterName }}
                      </p>
                    </div>
                    <p class="text-lg font-bold text-[#230C00] shrink-0">
                      &#36;{{ order.total | number:'1.0-0' }}
                    </p>
                  </div>

                  <!-- Items chips -->
                  <div class="mt-3 flex flex-wrap gap-1.5">
                    @for (item of order.items; track item.productId) {
                      <span class="bg-[#FFE7B3] text-[#230C00] text-xs font-medium
                                   px-2.5 py-1 rounded-full">
                        {{ item.quantity }}× {{ item.productName }}
                      </span>
                    }
                  </div>

                  <!-- Action button -->
                  <div class="mt-4">
                    @if (order.status === 'pending') {
                      <ion-button expand="block" (click)="updateStatus(order, 'preparing')"
                                  style="--background:#E8630A;--color:#230C00;--border-radius:12px">
                        Marcar como preparando
                      </ion-button>
                    } @else if (order.status === 'preparing') {
                      <ion-button expand="block" (click)="updateStatus(order, 'ready')"
                                  style="--background:#00B7A3;--color:#230C00;--border-radius:12px">
                        Marcar como lista ✓
                      </ion-button>
                    } @else if (order.status === 'ready') {
                      <ion-button expand="block" fill="outline" (click)="updateStatus(order, 'delivered')"
                                  style="--color:rgba(35,12,0,0.45);--border-color:rgba(35,12,0,0.12);
                                         --border-radius:12px">
                        Marcar como entregada
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

  protected readonly photoURL = computed(() => this.auth.currentUser()?.photoURL ?? null);
  protected readonly orders = this.orderService.activeOrders;
  protected readonly activeTab = signal<FilterTab>('all');

  protected readonly tabs = [
    { value: 'all'       as FilterTab, label: 'Todos',      icon: 'list-outline',             count: computed(() => this.orders().length) },
    { value: 'pending'   as FilterTab, label: 'Pendientes', icon: 'time-outline',             count: computed(() => this.orders().filter(o => o.status === 'pending').length) },
    { value: 'preparing' as FilterTab, label: 'Preparando', icon: 'flame-outline',            count: computed(() => this.orders().filter(o => o.status === 'preparing').length) },
    { value: 'ready'     as FilterTab, label: 'Listos',     icon: 'checkmark-circle-outline', count: computed(() => this.orders().filter(o => o.status === 'ready').length) },
  ];

  protected readonly activeTabLabel = computed(() =>
    this.tabs.find(t => t.value === this.activeTab())?.label ?? '',
  );

  protected readonly filteredOrders = computed(() => {
    const tab = this.activeTab();
    return tab === 'all' ? this.orders() : this.orders().filter(o => o.status === tab);
  });

  constructor() {
    addIcons({ checkmarkCircleOutline, flameOutline, listOutline, personCircleOutline, timeOutline });
  }

  onTabChange(ev: Event): void {
    this.activeTab.set((ev as CustomEvent).detail.value as FilterTab);
  }

  protected statusColor(s: string): string {
    return s === 'preparing' ? '#E8630A' : s === 'ready' ? '#00B7A3' : '#FFE7B3';
  }
  protected statusLabel(s: string): string {
    return s === 'preparing' ? 'Preparando' : s === 'ready' ? 'Lista' : 'Pendiente';
  }

  async updateStatus(order: Order, status: OrderStatus): Promise<void> {
    await this.orderService.updateOrderStatus(order.id, status);
  }
}
