import { Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  ActionSheetController,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logOutOutline, personCircleOutline } from 'ionicons/icons';
import { AuthService } from '../../core/auth/auth.service';
import { OrderService } from '../../core/db/order.service';
import { Order } from '../../core/models/order.model';

@Component({
  selector: 'app-barista',
  standalone: true,
  imports: [DecimalPipe, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar],
  styles: [`:host { display: block; height: 100%; }`],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <img slot="start" src="/logo_blanco_sin_fondo.svg" alt="Le Tiende"
             style="height:26px;margin-left:16px">
        <ion-title style="text-align:center">Barra</ion-title>
        <ion-buttons slot="end">
          @if (photoURL()) {
            <img [src]="photoURL()!" alt="avatar" referrerpolicy="no-referrer"
                 (click)="openUserMenu()"
                 style="width:32px;height:32px;border-radius:50%;object-fit:cover;
                        margin-right:12px;border:2px solid rgba(var(--ion-color-primary-contrast-rgb),.5);cursor:pointer">
          } @else {
            <ion-button fill="clear" (click)="openUserMenu()">
              <ion-icon slot="icon-only" name="person-circle-outline"
                        style="font-size:1.6rem;color:var(--ion-color-primary-contrast)" />
            </ion-button>
          }
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content style="--background:var(--color-surface)">
      <div class="p-4 lg:p-6 max-w-5xl mx-auto">

        <!-- Two-column layout: pending | preparing -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">

          <!-- ── Por preparar ─────────────────────────────────────────────── -->
          <section>
            <div class="flex items-center gap-2 mb-3">
              <h2 class="text-base font-bold text-espresso">Por preparar</h2>
              <span class="bg-cream text-espresso text-xs font-bold
                           px-2.5 py-0.5 rounded-full">
                {{ pendingOrders().length }}
              </span>
            </div>

            @if (pendingOrders().length === 0) {
              <div class="bg-white rounded-2xl py-12 text-center
                          shadow-[0_1px_3px_rgba(35,12,0,0.08)]">
                <p class="text-espresso/35 text-sm">Sin pedidos pendientes.</p>
              </div>
            } @else {
              <div class="flex flex-col gap-3">
                @for (order of pendingOrders(); track order.id) {
                  <div class="bg-white rounded-2xl shadow-[0_1px_3px_rgba(35,12,0,0.12)] overflow-hidden"
                       style="border-left:4px solid var(--ion-color-light)">
                    <div class="p-4">
                      <div class="flex items-baseline justify-between mb-1">
                        <span class="text-lg font-bold text-espresso">
                          Pedido: {{ order.tableNumber }}
                        </span>
                        <span class="text-sm font-bold text-espresso">
                          &#36;{{ order.total | number:'1.0-0' }}
                        </span>
                      </div>
                      <div style="display:flex;align-items:center;justify-content:space-between;margin:0 0 8px">
                        <p style="font-size:.75rem;color:rgba(var(--ion-color-primary-rgb),0.45);margin:0">{{ order.waiterName }}</p>
                        @if (order.paid) {
                          <span style="font-size:.65rem;font-weight:700;padding:2px 8px;border-radius:9999px;
                                       background:rgba(0,183,163,.15);color:var(--ion-color-tertiary)">✓ Pagado</span>
                        } @else {
                          <span style="font-size:.65rem;font-weight:700;padding:2px 8px;border-radius:9999px;
                                       background:rgba(232,99,10,.12);color:var(--ion-color-secondary)">Sin cobrar</span>
                        }
                      </div>
                      <div class="flex flex-wrap gap-1.5 mb-4">
                        @for (item of order.items; track item.productId) {
                          <span class="bg-surface text-espresso text-xs font-semibold
                                       px-2.5 py-1 rounded-full">
                            {{ item.quantity }}× {{ item.productName }}
                          </span>
                        }
                      </div>
                      <ion-button expand="block" color="secondary" class="btn-rounded"
                                  (click)="startPreparing(order)">
                        Preparando
                      </ion-button>
                    </div>
                  </div>
                }
              </div>
            }
          </section>

          <!-- ── En preparación ──────────────────────────────────────────── -->
          <section>
            <div class="flex items-center gap-2 mb-3">
              <h2 class="text-base font-bold text-espresso">En preparación</h2>
              <span class="text-espresso text-xs font-bold px-2.5 py-0.5 rounded-full"
                    style="background:var(--ion-color-secondary)">
                {{ preparingOrders().length }}
              </span>
            </div>

            @if (preparingOrders().length === 0) {
              <div class="bg-white rounded-2xl py-12 text-center
                          shadow-[0_1px_3px_rgba(35,12,0,0.08)]">
                <p class="text-espresso/35 text-sm">Nada en preparación.</p>
              </div>
            } @else {
              <div class="flex flex-col gap-3">
                @for (order of preparingOrders(); track order.id) {
                  <div class="bg-white rounded-2xl shadow-[0_1px_3px_rgba(35,12,0,0.12)] overflow-hidden"
                       style="border-left:4px solid var(--ion-color-secondary)">
                    <div class="p-4">
                      <div class="flex items-baseline justify-between mb-1">
                        <span class="text-lg font-bold text-espresso">
                          Pedido: {{ order.tableNumber }}
                        </span>
                        <span class="text-sm font-bold text-espresso">
                          &#36;{{ order.total | number:'1.0-0' }}
                        </span>
                      </div>
                      <div style="display:flex;align-items:center;justify-content:space-between;margin:0 0 8px">
                        <p style="font-size:.75rem;color:rgba(var(--ion-color-primary-rgb),0.45);margin:0">{{ order.waiterName }}</p>
                        @if (order.paid) {
                          <span style="font-size:.65rem;font-weight:700;padding:2px 8px;border-radius:9999px;
                                       background:rgba(0,183,163,.15);color:var(--ion-color-tertiary)">✓ Pagado</span>
                        } @else {
                          <span style="font-size:.65rem;font-weight:700;padding:2px 8px;border-radius:9999px;
                                       background:rgba(232,99,10,.12);color:var(--ion-color-secondary)">Sin cobrar</span>
                        }
                      </div>
                      <div class="flex flex-wrap gap-1.5 mb-4">
                        @for (item of order.items; track item.productId) {
                          <span class="bg-surface text-espresso text-xs font-semibold
                                       px-2.5 py-1 rounded-full">
                            {{ item.quantity }}× {{ item.productName }}
                          </span>
                        }
                      </div>
                      <ion-button expand="block" color="tertiary" class="btn-rounded"
                                  (click)="markReady(order)">
                        Listo ✓
                      </ion-button>
                    </div>
                  </div>
                }
              </div>
            }
          </section>

        </div>
      </div>
    </ion-content>
  `,
})
export class BaristaComponent {
  private auth = inject(AuthService);
  private orderService = inject(OrderService);
  private actionSheetCtrl = inject(ActionSheetController);

  protected readonly photoURL = computed(() => this.auth.currentUser()?.photoURL ?? null);
  protected readonly pendingOrders = computed(() =>
    this.orderService.activeOrders().filter(o => o.status === 'pending'),
  );
  protected readonly preparingOrders = computed(() =>
    this.orderService.activeOrders().filter(o => o.status === 'preparing'),
  );

  constructor() {
    addIcons({ logOutOutline, personCircleOutline });
  }

  async openUserMenu(): Promise<void> {
    const sheet = await this.actionSheetCtrl.create({
      header: this.auth.currentUser()?.displayName ?? 'Usuario',
      buttons: [
        {
          text: 'Cerrar sesión',
          role: 'destructive',
          icon: 'log-out-outline',
          handler: () => { void this.auth.signOut(); },
        },
        { text: 'Cancelar', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  startPreparing(order: Order): void {
    this.orderService.updateOrderStatusAsBarista(order.id, 'preparing');
  }

  markReady(order: Order): void {
    this.orderService.updateOrderStatusAsBarista(order.id, 'ready');
  }
}
