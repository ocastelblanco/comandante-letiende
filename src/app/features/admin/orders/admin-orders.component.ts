import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { OrderService } from '../../../core/db/order.service';
import { Order, OrderStatus } from '../../../core/models/order.model';

type FilterTab = 'all' | 'pending' | 'preparing' | 'ready';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [DecimalPipe, IonContent, IonHeader, IonTitle, IonToolbar],
  styles: [`
    :host { display: block; height: 100%; }
    @media (min-width: 1024px) { ion-header { display: none; } }
  `],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar style="--background:#F7F5F2;--color:#230C00">
        <ion-title>Pedidos</ion-title>
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

        <!-- Filter tabs -->
        <div class="flex gap-1 bg-white rounded-2xl p-1
                    shadow-[0_1px_3px_rgba(35,12,0,0.08)] mb-4"
             style="overflow-x:auto;scrollbar-width:none">
          @for (tab of tabs; track tab.value) {
            <button (click)="activeTab.set(tab.value)"
                    class="flex-1 py-2 px-3 rounded-xl text-sm font-semibold
                           transition-colors whitespace-nowrap min-w-fit"
                    [style.background]="activeTab() === tab.value ? '#230C00' : 'transparent'"
                    [style.color]="activeTab() === tab.value ? '#FFE7B3' : 'rgba(35,12,0,0.5)'">
              {{ tab.label }}
              @if (tab.count() > 0) {
                <span class="ml-1 opacity-60 text-xs">({{ tab.count() }})</span>
              }
            </button>
          }
        </div>

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
                      <button (click)="updateStatus(order, 'preparing')"
                              class="w-full bg-[#E8630A] text-[#230C00] text-sm font-semibold
                                     py-2.5 rounded-xl transition-opacity active:opacity-80">
                        Marcar como preparando
                      </button>
                    } @else if (order.status === 'preparing') {
                      <button (click)="updateStatus(order, 'ready')"
                              class="w-full bg-[#00B7A3] text-[#230C00] text-sm font-semibold
                                     py-2.5 rounded-xl transition-opacity active:opacity-80">
                        Marcar como lista ✓
                      </button>
                    } @else if (order.status === 'ready') {
                      <button (click)="updateStatus(order, 'delivered')"
                              class="w-full text-[#230C00]/50 text-sm font-semibold py-2.5
                                     rounded-xl border border-[#230C00]/12
                                     transition-opacity active:opacity-80">
                        Marcar como entregada
                      </button>
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
  private orderService = inject(OrderService);

  protected readonly orders    = this.orderService.activeOrders;
  protected readonly activeTab = signal<FilterTab>('all');

  protected readonly tabs = [
    { value: 'all'       as FilterTab, label: 'Todos',      count: computed(() => this.orders().length) },
    { value: 'pending'   as FilterTab, label: 'Pendientes', count: computed(() => this.orders().filter(o => o.status === 'pending').length) },
    { value: 'preparing' as FilterTab, label: 'Preparando', count: computed(() => this.orders().filter(o => o.status === 'preparing').length) },
    { value: 'ready'     as FilterTab, label: 'Listos',     count: computed(() => this.orders().filter(o => o.status === 'ready').length) },
  ];

  protected readonly filteredOrders = computed(() => {
    const tab = this.activeTab();
    return tab === 'all' ? this.orders() : this.orders().filter(o => o.status === tab);
  });

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
