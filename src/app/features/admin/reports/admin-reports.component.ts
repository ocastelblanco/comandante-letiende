import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { barChartOutline, calendarOutline, personCircleOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/auth/auth.service';
import { OrderService } from '../../../core/db/order.service';

interface ProductSummary {
  productName: string;
  quantity: number;
  base: number;
  tip: number;
  total: number;
}

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [
    DecimalPipe,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonSpinner,
    IonTitle,
    IonToolbar,
  ],
  styles: [`
    :host { display: block; height: 100%; }
    @media (min-width: 1024px) { ion-header { display: none; } }
    input[type="date"] {
      padding: 8px 12px;
      border: 1.5px solid #FFE7B3;
      border-radius: 10px;
      font-size: .9rem;
      color: #230C00;
      background: #fff;
      outline: none;
      cursor: pointer;
    }
    input[type="date"]:focus { border-color: #E8630A; }
  `],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar style="--background:#230C00;--color:#FFE7B3">
        <img slot="start" src="/logo_blanco_sin_fondo.svg" alt="Le Tiende"
             style="height:24px;margin-left:16px">
        <ion-title>Reportes</ion-title>
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
      <div style="padding:16px;max-width:900px;margin:0 auto">

        <!-- Desktop page header -->
        <div class="hidden lg:block" style="margin-bottom:24px">
          <h1 style="font-size:1.5rem;font-weight:700;color:#230C00">Consolidado de ventas</h1>
        </div>

        <!-- Date selector -->
        <div style="background:#fff;border-radius:16px;padding:14px 16px;margin-bottom:16px;
                    box-shadow:0 1px 3px rgba(35,12,0,.1);display:flex;align-items:center;gap:12px">
          <ion-icon name="calendar-outline" style="font-size:1.25rem;color:#E8630A;flex-shrink:0" />
          <span style="font-size:.875rem;font-weight:600;color:#230C00;flex-shrink:0">Fecha</span>
          <input type="date" [value]="selectedDate()" (change)="onDateChange($event)">
        </div>

        <!-- Loading -->
        @if (loading()) {
          <div style="display:flex;justify-content:center;padding:64px 0">
            <ion-spinner name="crescent" style="--color:#E8630A;width:36px;height:36px" />
          </div>

        <!-- Error state -->
        } @else if (errorMsg()) {
          <div style="background:#fff;border-radius:16px;box-shadow:0 1px 3px rgba(35,12,0,.1);
                      display:flex;flex-direction:column;align-items:center;justify-content:center;
                      padding:48px 24px;gap:10px">
            <p style="font-size:.875rem;font-weight:600;color:#C0392B;margin:0">Error al cargar el reporte</p>
            <p style="font-size:.8rem;color:rgba(35,12,0,.5);text-align:center;max-width:320px;margin:0">
              {{ errorMsg() }}
            </p>
          </div>

        <!-- Empty state -->
        } @else if (summary().length === 0) {
          <div style="background:#fff;border-radius:16px;box-shadow:0 1px 3px rgba(35,12,0,.1);
                      display:flex;flex-direction:column;align-items:center;justify-content:center;
                      padding:64px 24px;gap:12px">
            <ion-icon name="bar-chart-outline"
                      style="font-size:3.5rem;color:rgba(35,12,0,0.18)" />
            <p style="font-size:1rem;font-weight:600;color:#230C00;margin:0">Sin ventas este día</p>
            <p style="font-size:.875rem;color:rgba(35,12,0,.4);text-align:center;max-width:260px;margin:0">
              No hay órdenes entregadas para la fecha seleccionada.
            </p>
          </div>

        <!-- Consolidado table -->
        } @else {
          <div style="background:#fff;border-radius:16px;box-shadow:0 1px 3px rgba(35,12,0,.1);overflow:hidden">
            <div style="overflow-x:auto">
              <table style="width:100%;border-collapse:collapse;min-width:460px">
                <thead>
                  <tr style="background:#230C00">
                    <th style="text-align:left;padding:10px 16px;font-size:.7rem;font-weight:700;
                               text-transform:uppercase;letter-spacing:.06em;color:#FFE7B3">
                      Producto
                    </th>
                    <th style="text-align:right;padding:10px 16px;font-size:.7rem;font-weight:700;
                               text-transform:uppercase;letter-spacing:.06em;color:#FFE7B3;white-space:nowrap">
                      Cant.
                    </th>
                    <th style="text-align:right;padding:10px 16px;font-size:.7rem;font-weight:700;
                               text-transform:uppercase;letter-spacing:.06em;color:#FFE7B3">
                      Base
                    </th>
                    <th style="text-align:right;padding:10px 16px;font-size:.7rem;font-weight:700;
                               text-transform:uppercase;letter-spacing:.06em;color:#FFE7B3">
                      Propina
                    </th>
                    <th style="text-align:right;padding:10px 16px;font-size:.7rem;font-weight:700;
                               text-transform:uppercase;letter-spacing:.06em;color:#FFE7B3">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of summary(); track row.productName) {
                    <tr style="border-bottom:1px solid #FFE7B3">
                      <td style="padding:10px 16px;font-size:.875rem;color:#251a00;font-weight:500">
                        {{ row.productName }}
                      </td>
                      <td style="padding:10px 16px;font-size:.875rem;color:#251a00;text-align:right">
                        {{ row.quantity }}
                      </td>
                      <td style="padding:10px 16px;font-size:.875rem;color:#251a00;text-align:right;white-space:nowrap">
                        $ {{ row.base | number:'1.0-0' }}
                      </td>
                      <td style="padding:10px 16px;font-size:.875rem;color:#251a00;text-align:right;white-space:nowrap">
                        $ {{ row.tip | number:'1.0-0' }}
                      </td>
                      <td style="padding:10px 16px;font-size:.875rem;font-weight:700;color:#251a00;
                                 text-align:right;white-space:nowrap">
                        $ {{ row.total | number:'1.0-0' }}
                      </td>
                    </tr>
                  }
                </tbody>
                <tfoot>
                  <tr style="background:#FFF8F1;border-top:2px solid #FFE7B3">
                    <td style="padding:12px 16px;font-size:.875rem;font-weight:700;color:#230C00">
                      Total del día
                    </td>
                    <td style="padding:12px 16px;font-size:.875rem;font-weight:700;color:#230C00;text-align:right">
                      {{ totals().quantity }}
                    </td>
                    <td style="padding:12px 16px;font-size:.875rem;font-weight:700;color:#230C00;
                               text-align:right;white-space:nowrap">
                      $ {{ totals().base | number:'1.0-0' }}
                    </td>
                    <td style="padding:12px 16px;font-size:.875rem;font-weight:700;color:#E8630A;
                               text-align:right;white-space:nowrap">
                      $ {{ totals().tip | number:'1.0-0' }}
                    </td>
                    <td style="padding:12px 16px;font-size:1rem;font-weight:700;color:#E8630A;
                               text-align:right;white-space:nowrap">
                      $ {{ totals().total | number:'1.0-0' }}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        }

      </div>
    </ion-content>
  `,
})
export class AdminReportsComponent {
  private readonly auth = inject(AuthService);
  private readonly orderService = inject(OrderService);

  protected readonly photoURL = computed(() => this.auth.currentUser()?.photoURL ?? null);

  readonly selectedDate = signal(this.todayString());
  readonly loading = signal(false);
  readonly errorMsg = signal('');
  readonly summary = signal<ProductSummary[]>([]);

  readonly totals = computed(() => ({
    quantity: this.summary().reduce((s, r) => s + r.quantity, 0),
    base: this.summary().reduce((s, r) => s + r.base, 0),
    tip: this.summary().reduce((s, r) => s + r.tip, 0),
    total: this.summary().reduce((s, r) => s + r.total, 0),
  }));

  constructor() {
    addIcons({ barChartOutline, calendarOutline, personCircleOutline });
    this.loadReport(this.selectedDate());
  }

  async onDateChange(event: Event): Promise<void> {
    const value = (event.target as HTMLInputElement).value;
    if (!value) return;
    this.selectedDate.set(value);
    await this.loadReport(value);
  }

  private todayString(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private async loadReport(dateStr: string): Promise<void> {
    this.loading.set(true);
    this.errorMsg.set('');
    this.summary.set([]);
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      const orders = await this.orderService.getOrdersByDate(date);

      const map = new Map<string, ProductSummary>();
      for (const order of orders) {
        for (const item of order.items) {
          const baseUnit = item.unitPrice - item.tipAmount;
          const existing = map.get(item.productId);
          if (existing) {
            existing.quantity += item.quantity;
            existing.base += baseUnit * item.quantity;
            existing.tip += item.tipAmount * item.quantity;
            existing.total += item.unitPrice * item.quantity;
          } else {
            map.set(item.productId, {
              productName: item.productName,
              quantity: item.quantity,
              base: baseUnit * item.quantity,
              tip: item.tipAmount * item.quantity,
              total: item.unitPrice * item.quantity,
            });
          }
        }
      }

      this.summary.set(
        [...map.values()].sort((a, b) => a.productName.localeCompare(b.productName, 'es')),
      );
    } catch (err) {
      console.error('[loadReport]', err);
      const msg = err instanceof Error ? err.message : '';
      this.errorMsg.set(
        msg.includes('currently building')
          ? 'El índice de Firestore se está construyendo (tarda ~2 min). Recarga la página en un momento.'
          : msg || 'Error desconocido. Revisa la consola.',
      );
    } finally {
      this.loading.set(false);
    }
  }
}
