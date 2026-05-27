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
import { Timestamp } from '@angular/fire/firestore';
import { utils, writeFileXLSX } from 'xlsx';
import { addIcons } from 'ionicons';
import { barChartOutline, calendarOutline, downloadOutline, personCircleOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/auth/auth.service';
import { OrderService } from '../../../core/db/order.service';

interface OrderRow {
  id: string;
  tableNumber: string;
  paidAtLabel: string;
  paymentLabel: string;
  paymentColor: string;
  itemsLabel: string;
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
    input[type="datetime-local"] {
      padding: 8px 12px;
      border: 1.5px solid var(--ion-color-light);
      border-radius: 10px;
      font-size: .9rem;
      color: var(--ion-color-primary);
      background: #fff;
      outline: none;
      cursor: pointer;
    }
    input[type="datetime-local"]:focus { border-color: var(--ion-color-secondary); }
  `],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <img slot="start" src="/logo_blanco_sin_fondo.svg" alt="Le Tiende"
             style="height:24px;margin-left:16px">
        <ion-title>Reportes</ion-title>
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
      <div style="padding:16px;max-width:900px;margin:0 auto">

        <!-- Desktop page header -->
        <div class="hidden lg:block" style="margin-bottom:24px">
          <h1 style="font-size:1.5rem;font-weight:700;color:var(--ion-color-primary)">Consolidado de ventas</h1>
        </div>

        <!-- Range selector -->
        <div style="background:#fff;border-radius:16px;padding:14px 16px;margin-bottom:16px;
                    box-shadow:0 1px 3px rgba(35,12,0,.1)">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <ion-icon name="calendar-outline" style="font-size:1.25rem;color:var(--ion-color-secondary);flex-shrink:0" />
            <span style="font-size:.875rem;font-weight:600;color:var(--ion-color-primary);flex-shrink:0">Desde</span>
            <input type="datetime-local" [value]="startDatetime()" (change)="onStartChange($event)">
            <span style="font-size:.875rem;font-weight:600;color:var(--ion-color-primary);flex-shrink:0">Hasta</span>
            <input type="datetime-local" [value]="endDatetime()" (change)="onEndChange($event)">
          </div>
        </div>

        <!-- Loading -->
        @if (loading()) {
          <div style="display:flex;justify-content:center;padding:64px 0">
            <ion-spinner name="crescent" style="--color:var(--ion-color-secondary);width:36px;height:36px" />
          </div>

        <!-- Error state -->
        } @else if (errorMsg()) {
          <div style="background:#fff;border-radius:16px;box-shadow:0 1px 3px rgba(35,12,0,.1);
                      display:flex;flex-direction:column;align-items:center;justify-content:center;
                      padding:48px 24px;gap:10px">
            <p style="font-size:.875rem;font-weight:600;color:#C0392B;margin:0">Error al cargar el reporte</p>
            <p style="font-size:.8rem;color:rgba(var(--ion-color-primary-rgb),.5);text-align:center;max-width:320px;margin:0">
              {{ errorMsg() }}
            </p>
          </div>

        <!-- Empty state -->
        } @else if (orders().length === 0) {
          <div style="background:#fff;border-radius:16px;box-shadow:0 1px 3px rgba(35,12,0,.1);
                      display:flex;flex-direction:column;align-items:center;justify-content:center;
                      padding:64px 24px;gap:12px">
            <ion-icon name="bar-chart-outline"
                      style="font-size:3.5rem;color:rgba(var(--ion-color-primary-rgb),0.18)" />
            <p style="font-size:1rem;font-weight:600;color:var(--ion-color-primary);margin:0">Sin pedidos en el rango</p>
            <p style="font-size:.875rem;color:rgba(var(--ion-color-primary-rgb),.4);text-align:center;max-width:260px;margin:0">
              No hay pedidos cobrados en el período seleccionado.
            </p>
          </div>

        <!-- Consolidado table -->
        } @else {
          <div style="display:flex;justify-content:flex-end;margin-bottom:10px">
            <ion-button (click)="exportToExcel()" fill="outline" class="btn-rounded"
                        style="--color:var(--ion-color-primary);--border-color:rgba(var(--ion-color-primary-rgb),0.25)">
              <ion-icon slot="start" name="download-outline" />
              Descargar Excel
            </ion-button>
          </div>
          <div style="background:#fff;border-radius:16px;box-shadow:0 1px 3px rgba(35,12,0,.1);overflow:hidden">
            <div style="overflow-x:auto">
              <table style="width:100%;border-collapse:collapse;min-width:700px">
                <thead>
                  <tr style="background:var(--ion-color-primary)">
                    <th style="text-align:left;padding:10px 16px;font-size:.7rem;font-weight:700;
                               text-transform:uppercase;letter-spacing:.06em;color:var(--ion-color-primary-contrast)">
                      Pedido
                    </th>
                    <th style="text-align:left;padding:10px 16px;font-size:.7rem;font-weight:700;
                               text-transform:uppercase;letter-spacing:.06em;color:var(--ion-color-primary-contrast);white-space:nowrap">
                      Hora de cobro
                    </th>
                    <th style="text-align:left;padding:10px 16px;font-size:.7rem;font-weight:700;
                               text-transform:uppercase;letter-spacing:.06em;color:var(--ion-color-primary-contrast);white-space:nowrap">
                      Medio de pago
                    </th>
                    <th style="text-align:left;padding:10px 16px;font-size:.7rem;font-weight:700;
                               text-transform:uppercase;letter-spacing:.06em;color:var(--ion-color-primary-contrast)">
                      Ítems
                    </th>
                    <th style="text-align:right;padding:10px 16px;font-size:.7rem;font-weight:700;
                               text-transform:uppercase;letter-spacing:.06em;color:var(--ion-color-primary-contrast)">
                      Base
                    </th>
                    <th style="text-align:right;padding:10px 16px;font-size:.7rem;font-weight:700;
                               text-transform:uppercase;letter-spacing:.06em;color:var(--ion-color-primary-contrast)">
                      Propina
                    </th>
                    <th style="text-align:right;padding:10px 16px;font-size:.7rem;font-weight:700;
                               text-transform:uppercase;letter-spacing:.06em;color:var(--ion-color-primary-contrast)">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of orders(); track row.id) {
                    <tr style="border-bottom:1px solid var(--ion-color-light)">
                      <td style="padding:10px 16px;font-size:.875rem;color:var(--ion-color-dark);font-weight:600">
                        {{ row.tableNumber }}
                      </td>
                      <td style="padding:10px 16px;font-size:.875rem;color:var(--ion-color-dark);white-space:nowrap">
                        {{ row.paidAtLabel }}
                      </td>
                      <td style="padding:10px 16px">
                        <span style="padding:3px 10px;border-radius:9999px;font-size:.75rem;font-weight:600;
                                     line-height:1;color:#fff;white-space:nowrap"
                              [style.background]="row.paymentColor">
                          {{ row.paymentLabel }}
                        </span>
                      </td>
                      <td style="padding:10px 16px;font-size:.8rem;color:var(--ion-color-medium);max-width:220px">
                        {{ row.itemsLabel }}
                      </td>
                      <td style="padding:10px 16px;font-size:.875rem;color:var(--ion-color-dark);text-align:right;white-space:nowrap">
                        $ {{ row.base | number:'1.0-0' }}
                      </td>
                      <td style="padding:10px 16px;font-size:.875rem;color:var(--ion-color-dark);text-align:right;white-space:nowrap">
                        $ {{ row.tip | number:'1.0-0' }}
                      </td>
                      <td style="padding:10px 16px;font-size:.875rem;font-weight:700;color:var(--ion-color-dark);
                                 text-align:right;white-space:nowrap">
                        $ {{ row.total | number:'1.0-0' }}
                      </td>
                    </tr>
                  }
                </tbody>
                <tfoot>
                  <tr style="background:var(--ion-background-color);border-top:2px solid var(--ion-color-light)">
                    <td colspan="4" style="padding:12px 16px;font-size:.875rem;font-weight:700;color:var(--ion-color-primary)">
                      Total del rango
                    </td>
                    <td style="padding:12px 16px;font-size:.875rem;font-weight:700;color:var(--ion-color-primary);
                               text-align:right;white-space:nowrap">
                      $ {{ totals().base | number:'1.0-0' }}
                    </td>
                    <td style="padding:12px 16px;font-size:.875rem;font-weight:700;color:var(--ion-color-secondary);
                               text-align:right;white-space:nowrap">
                      $ {{ totals().tip | number:'1.0-0' }}
                    </td>
                    <td style="padding:12px 16px;font-size:1rem;font-weight:700;color:var(--ion-color-secondary);
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

  readonly startDatetime = signal(this.todayStartString());
  readonly endDatetime = signal(this.todayEndString());
  readonly loading = signal(false);
  readonly errorMsg = signal('');
  readonly orders = signal<OrderRow[]>([]);

  readonly totals = computed(() => ({
    base: this.orders().reduce((s, r) => s + r.base, 0),
    tip: this.orders().reduce((s, r) => s + r.tip, 0),
    total: this.orders().reduce((s, r) => s + r.total, 0),
  }));

  constructor() {
    addIcons({ barChartOutline, calendarOutline, downloadOutline, personCircleOutline });
    this.loadReport();
  }

  async onStartChange(event: Event): Promise<void> {
    const value = (event.target as HTMLInputElement).value;
    if (!value) return;
    this.startDatetime.set(value);
    await this.loadReport();
  }

  async onEndChange(event: Event): Promise<void> {
    const value = (event.target as HTMLInputElement).value;
    if (!value) return;
    this.endDatetime.set(value);
    await this.loadReport();
  }

  exportToExcel(): void {
    const pad = (n: number) => String(n).padStart(2, '0');
    const now = new Date();
    const filename = `reporte-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.xlsx`;

    const rows = this.orders().map((r) => ({
      'Pedido': r.tableNumber,
      'Hora de cobro': r.paidAtLabel,
      'Medio de pago': r.paymentLabel,
      'Ítems': r.itemsLabel,
      'Base ($)': r.base,
      'Propina ($)': r.tip,
      'Total ($)': r.total,
    }));
    rows.push({
      'Pedido': 'TOTAL',
      'Hora de cobro': '',
      'Medio de pago': '',
      'Ítems': '',
      'Base ($)': this.totals().base,
      'Propina ($)': this.totals().tip,
      'Total ($)': this.totals().total,
    });

    const ws = utils.json_to_sheet(rows);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Reporte');
    writeFileXLSX(wb, filename);
  }

  private todayStartString(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T00:00`;
  }

  private todayEndString(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T23:59`;
  }

  private formatPaidAt(ts: Timestamp | null): string {
    if (!ts) return '—';
    const d = ts.toDate();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm} ${hh}:${min}`;
  }

  private paymentColor(method: string | null): string {
    if (method === 'card') return 'var(--ion-color-secondary)';
    if (method === 'cash') return 'var(--ion-color-tertiary)';
    if (method === 'nequi' || method === 'daviplata') return 'var(--color-purple)';
    return 'var(--ion-color-medium)';
  }

  private paymentLabel(method: string | null): string {
    if (method === 'card') return 'Datáfono';
    if (method === 'cash') return 'Efectivo';
    if (method === 'nequi') return 'Nequi';
    if (method === 'daviplata') return 'Daviplata';
    return '—';
  }

  private async loadReport(): Promise<void> {
    this.loading.set(true);
    this.errorMsg.set('');
    this.orders.set([]);
    try {
      const start = new Date(this.startDatetime());
      const end = new Date(this.endDatetime());
      const rawOrders = await this.orderService.getOrdersByRange(start, end);

      const rows: OrderRow[] = rawOrders.map((order) => ({
        id: order.id,
        tableNumber: order.tableNumber,
        paidAtLabel: this.formatPaidAt(order.paidAt ?? null),
        paymentLabel: this.paymentLabel(order.paymentMethod ?? null),
        paymentColor: this.paymentColor(order.paymentMethod ?? null),
        itemsLabel: order.items.map((i) => `${i.productName} ×${i.quantity}`).join(', '),
        base: order.items.reduce((s, i) => s + (i.unitPrice - i.tipAmount) * i.quantity, 0),
        tip: order.items.reduce((s, i) => s + i.tipAmount * i.quantity, 0),
        total: order.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
      }));

      this.orders.set(rows);
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
