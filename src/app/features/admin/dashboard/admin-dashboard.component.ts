import { Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personCircleOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/auth/auth.service';
import { OrderService } from '../../../core/db/order.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [DecimalPipe, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar],
  styles: [`
    :host { display: block; height: 100%; }
    @media (min-width: 1024px) { ion-header { display: none; } }
  `],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar style="--background:#230C00;--color:#FFE7B3">
        <img slot="start" src="/logo_blanco_sin_fondo.svg" alt="Le Tiende"
             style="height:24px;margin-left:16px">
        <ion-title>Dashboard</ion-title>
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
      <div class="p-4 lg:p-8 max-w-5xl mx-auto">

        <!-- Desktop page header -->
        <div class="hidden lg:flex items-baseline justify-between mb-8">
          <div>
            <h1 class="text-2xl font-bold text-[#230C00]">Hola, {{ firstName() }}</h1>
            <p class="text-[#230C00]/45 text-sm mt-0.5 capitalize">{{ today }}</p>
          </div>
        </div>

        <!-- KPI cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
          @for (kpi of kpis(); track kpi.label) {
            <div class="bg-white rounded-2xl p-4 lg:p-5
                        shadow-[0_1px_3px_rgba(35,12,0,0.12)]">
              <p class="text-[#230C00]/45 text-[11px] font-semibold tracking-wider uppercase">
                {{ kpi.label }}
              </p>
              <p class="text-[#E8630A] text-3xl font-bold mt-1 leading-none">
                {{ kpi.value }}
              </p>
              <p class="text-[#230C00]/40 text-xs mt-1.5">{{ kpi.sub }}</p>
            </div>
          }
        </div>

        <!-- Active orders card -->
        <div class="bg-white rounded-2xl shadow-[0_1px_3px_rgba(35,12,0,0.12)] overflow-hidden">
          <div class="px-5 py-4 border-b border-[#230C00]/8 flex items-center gap-3">
            <h2 class="flex-1 text-base font-semibold text-[#230C00]">Pedidos activos</h2>
            <span class="bg-[#FFE7B3] text-[#230C00] text-xs font-bold px-2.5 py-0.5 rounded-full">
              {{ activeOrders().length }}
            </span>
          </div>

          @if (activeOrders().length === 0) {
            <div class="px-5 py-12 text-center text-[#230C00]/35 text-sm">
              No hay pedidos activos en este momento.
            </div>
          } @else {
            <div class="divide-y divide-[#230C00]/8">
              @for (order of activeOrders(); track order.id) {
                <div class="flex items-center gap-4 px-5 py-3.5"
                     [style.border-left]="'4px solid ' + statusColor(order.status)">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-semibold text-[#230C00]">
                        Mesa {{ order.tableNumber }}
                      </span>
                      <span class="text-[#230C00]/30 text-xs">·</span>
                      <span class="text-[#230C00]/45 text-xs truncate">{{ order.waiterName }}</span>
                    </div>
                    <p class="text-xs text-[#230C00]/45 mt-0.5">
                      {{ order.items.length }} ítem{{ order.items.length !== 1 ? 's' : '' }}
                    </p>
                  </div>
                  <div class="text-right shrink-0">
                    <p class="text-sm font-bold text-[#230C00]">
                      &#36;{{ order.total | number:'1.0-0' }}
                    </p>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                          [style.background]="statusColor(order.status)"
                          style="color:#230C00">
                      {{ statusLabel(order.status) }}
                    </span>
                  </div>
                </div>
              }
            </div>
          }
        </div>

      </div>
    </ion-content>
  `,
})
export class AdminDashboardComponent {
  private auth         = inject(AuthService);
  private orderService = inject(OrderService);

  protected readonly activeOrders = this.orderService.activeOrders;
  protected readonly photoURL     = computed(() => this.auth.currentUser()?.photoURL ?? null);
  protected readonly firstName    = computed(() => {
    const name = this.auth.currentUser()?.displayName;
    return name ? name.split(' ')[0] : 'Admin';
  });

  protected readonly today = new Date().toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  protected readonly kpis = computed(() => {
    const orders   = this.activeOrders();
    const pending  = orders.filter(o => o.status === 'pending').length;
    const preparing = orders.filter(o => o.status === 'preparing').length;
    const ready    = orders.filter(o => o.status === 'ready').length;
    return [
      { label: 'En cola',     value: `${orders.length}`, sub: 'pedidos activos' },
      { label: 'Pendientes',  value: `${pending}`,       sub: 'por preparar'   },
      { label: 'Preparando',  value: `${preparing}`,     sub: 'en barra'       },
      { label: 'Listos',      value: `${ready}`,         sub: 'por entregar'   },
    ];
  });

  constructor() {
    addIcons({ personCircleOutline });
  }

  protected statusColor(s: string): string {
    return s === 'preparing' ? '#E8630A' : s === 'ready' ? '#00B7A3' : '#FFE7B3';
  }
  protected statusLabel(s: string): string {
    return s === 'preparing' ? 'Preparando' : s === 'ready' ? 'Lista' : 'Pendiente';
  }
}
