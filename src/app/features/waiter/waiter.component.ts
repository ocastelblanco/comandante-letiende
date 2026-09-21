import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
  ActionSheetController,
  AlertController,
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
  IonTextarea,
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
  cardOutline,
  cashOutline,
  closeOutline,
  filterOutline,
  logOutOutline,
  notificationsOutline,
  optionsOutline,
  pencilOutline,
  personCircleOutline,
  qrCodeOutline,
  removeCircleOutline,
  timeOutline,
  trashOutline,
} from 'ionicons/icons';
import { AuthService } from '../../core/auth/auth.service';
import { OrderService } from '../../core/db/order.service';
import { ProductService } from '../../core/db/product.service';
import { OrderItem } from '../../core/models/order-item.model';
import { Order, OrderStatus, PaymentMethod } from '../../core/models/order.model';
import { computeOrderTotals } from '../../core/models/order-totals';
import { PAYMENT_METHODS } from '../../core/models/payment-methods';
import { Product, ProductAddition } from '../../core/models/product.model';

type View = 'dashboard' | 'new-order';

interface OrderLine {
  id: number;
  query: string;
  filteredProducts: Product[];
  selectedProduct: Product | null;
  quantity: number;
  // `null` si el producto no tiene variantes o aún no se ha elegido una.
  selectedVariant: string | null;
  selectedAdditions: ProductAddition[];
}

const STATUS_BADGE: Record<OrderStatus, { bg: string; text: string }> = {
  pending:   { bg: 'var(--ion-color-light)',     text: 'var(--ion-color-primary)' },
  preparing: { bg: 'var(--ion-color-secondary)', text: 'var(--ion-color-primary)' },
  ready:     { bg: 'var(--ion-color-tertiary)',  text: 'var(--ion-color-primary)' },
  delivered: { bg: 'var(--ion-color-medium)',    text: '#ffffff' },
  cancelled: { bg: '#C0392B',                   text: '#ffffff' },
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
    IonTextarea,
  ],
  template: `
    @if (view() === 'dashboard') {
      <!-- ── Dashboard ──────────────────────────────────────────────────── -->
      <ion-header>
        <ion-toolbar>
          <img slot="start" src="/logo_blanco_sin_fondo.svg" alt="Le Tiende" width="59" height="26" style="height:26px;margin-left:16px">
          <ion-title class="text-center">Comandante</ion-title>
          <ion-buttons slot="end">
            @if (authService.currentUser()?.photoURL; as photoURL) {
              <img [src]="photoURL" alt="avatar" referrerpolicy="no-referrer"
                   (click)="openUserMenu()"
                   style="width:32px;height:32px;border-radius:50%;object-fit:cover;margin-right:12px;border:2px solid rgba(var(--ion-color-primary-contrast-rgb),.5);cursor:pointer">
            } @else {
              <ion-button fill="clear" (click)="openUserMenu()">
                <ion-icon slot="icon-only" name="person-circle-outline" style="font-size:1.6rem;color:var(--ion-color-primary-contrast)" />
              </ion-button>
            }
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content>
        @for (alert of visibleReadyAlerts(); track alert.id) {
          <div style="background:var(--ion-color-secondary);color:var(--ion-color-primary);padding:10px 16px;display:flex;align-items:center;gap:8px">
            <ion-icon name="notifications-outline" style="font-size:1.1rem;flex-shrink:0" />
            <span style="flex:1;font-size:.875rem;font-weight:600">
              ¡"{{ alert.tableNumber }}" listo para entregar!
            </span>
            <ion-button fill="clear" size="small" (click)="dismissAlert(alert.id)" style="--color:var(--ion-color-primary);flex-shrink:0">
              <ion-icon slot="icon-only" name="close-outline" />
            </ion-button>
          </div>
        }

        <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 16px 8px">
          <span style="font-size:1rem;font-weight:700;color:var(--ion-color-dark)">
            {{ filterReady() ? 'Listos para entregar' : 'Pedidos Activos' }}
          </span>
          <ion-button fill="clear" size="small" (click)="filterReady.update(v => !v)"
                      [style.--color]="filterReady() ? 'var(--ion-color-secondary)' : 'rgba(var(--ion-color-primary-rgb),0.4)'">
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
                    <span style="font-size:1rem;font-weight:700;color:var(--ion-color-dark)">{{ order.tableNumber }}</span>
                    <div style="display:flex;align-items:center;gap:6px">
                      <span
                        style="padding:4px 12px;border-radius:9999px;font-size:.75rem;font-weight:600;line-height:1"
                        [style.background]="statusBadge[order.status].bg"
                        [style.color]="statusBadge[order.status].text"
                      >{{ statusLabels[order.status] }}</span>
                      @if (order.paid) {
                        <span style="padding:4px 10px;border-radius:9999px;font-size:.7rem;
                                     font-weight:700;line-height:1;
                                     background:rgba(0,183,163,.15);color:var(--ion-color-tertiary)">
                          ✓ Pagado
                        </span>
                      } @else {
                        <span (click)="markPaid(order); $event.stopPropagation()"
                              style="padding:4px 10px;border-radius:9999px;font-size:.7rem;
                                     font-weight:700;line-height:1;cursor:pointer;
                                     background:rgba(232,99,10,.12);color:var(--ion-color-secondary)">
                          Cobrar
                        </span>
                      }
                    </div>
                  </div>
                  <div style="display:flex;align-items:center;gap:4px;font-size:.8rem;color:var(--ion-color-medium)">
                    <ion-icon name="time-outline" style="font-size:.9rem" />
                    <span>{{ timeAgo(order.createdAt) }}</span>
                  </div>
                  @if (expandedOrderId() === order.id) {
                    <div style="margin-top:10px;border-top:1px solid var(--ion-color-light);padding-top:8px">
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
                      @if (order.observations) {
                        <div style="display:flex;gap:6px;align-items:flex-start;background:var(--ion-color-light);border-radius:10px;padding:6px 10px;margin:6px 0">
                          <span style="font-size:.85rem;line-height:1.2">📝</span>
                          <p style="font-size:.75rem;color:var(--ion-color-medium);font-style:italic;margin:0">{{ order.observations }}</p>
                        </div>
                      }
                      <div style="border-top:1px solid rgba(var(--ion-color-primary-contrast-rgb),.6);margin:6px 0 4px"></div>
                      <div style="display:flex;justify-content:space-between;font-size:.75rem;color:var(--ion-color-medium);padding:2px 0">
                        <span>Subtotal (base)</span>
                        <span>$ {{ order.subtotal | number:'1.0-0' }}</span>
                      </div>
                      <div style="display:flex;justify-content:space-between;align-items:center;font-size:.75rem;color:var(--ion-color-medium);padding:2px 0">
                        <span>Propina</span>
                        <span style="display:flex;align-items:center;gap:4px">
                          $ {{ order.tipAmount | number:'1.0-0' }}
                          @if (!order.paid) {
                            <ion-button fill="clear" size="small" (click)="editOrderTip(order, $event)"
                                        style="margin:0;--padding-start:4px;--padding-end:4px;height:20px">
                              <ion-icon slot="icon-only" name="pencil-outline" style="font-size:.85rem" />
                            </ion-button>
                          }
                        </span>
                      </div>
                      <div style="display:flex;justify-content:space-between;font-size:.9rem;font-weight:700;color:var(--ion-color-dark);padding:4px 0 2px">
                        <span>Total</span>
                        <span>$ {{ order.total | number:'1.0-0' }}</span>
                      </div>
                      @if (order.status === 'ready') {
                        <ion-button expand="block" size="small" color="tertiary"
                                    (click)="markDelivered(order); $event.stopPropagation()"
                                    style="margin-top:10px;--border-radius:10px">
                          Entregar ✓
                        </ion-button>
                      }
                    </div>
                  } @else {
                    <div style="font-size:.8rem;color:var(--ion-color-medium);margin-top:4px">
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
              <ion-icon slot="icon-only" name="arrow-back-outline" style="color:var(--ion-color-primary-contrast)" />
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
              <div style="display:flex;flex-direction:column;gap:6px;padding:12px 14px;margin-bottom:8px;background:#ffffff;border-radius:16px;box-shadow:0 1px 4px rgba(35,12,0,.08)">
                <div style="display:flex;align-items:center;gap:8px">
                  <div style="flex:1;min-width:0">
                    <div style="font-weight:600;font-size:.9rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--ion-color-dark)">
                      {{ line.selectedProduct.name }}
                    </div>
                    <div style="font-size:.75rem;color:var(--ion-color-medium);margin-top:2px">
                      $ {{ lineUnitPrice(line) | number:'1.0-0' }} c/u
                    </div>
                  </div>
                  <div style="display:flex;align-items:center;gap:2px;background:var(--ion-color-light);border-radius:9999px;padding:2px">
                    <ion-button fill="clear" size="small" [disabled]="line.quantity <= 1" (click)="decrementLine(line.id)">
                      <ion-icon slot="icon-only" name="remove-circle-outline" />
                    </ion-button>
                    <span style="min-width:1.5rem;text-align:center;font-weight:700;font-size:.9rem;color:var(--ion-color-primary)">
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
                @if (line.selectedProduct.variants.length > 0 || line.selectedProduct.additions.length > 0) {
                  <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center">
                    @if (line.selectedProduct.variants.length > 0) {
                      <span (click)="openVariantSheet(line.id, line.selectedProduct)"
                            style="padding:4px 10px;border-radius:9999px;font-size:.7rem;font-weight:600;cursor:pointer;
                                   background:rgba(var(--ion-color-primary-rgb),.08);color:var(--ion-color-primary)">
                        <ion-icon name="options-outline" style="font-size:.8rem;vertical-align:-1px" />
                        {{ line.selectedVariant ?? 'Elegir variante' }}
                      </span>
                    }
                    @for (addition of line.selectedAdditions; track addition.addition) {
                      <span style="padding:4px 10px;border-radius:9999px;font-size:.7rem;font-weight:600;
                                   background:var(--ion-color-light);color:var(--ion-color-dark)">
                        {{ addition.addition }}
                      </span>
                    }
                    @if (line.selectedProduct.additions.length > 0) {
                      <span (click)="openAdditionsAlert(line.id, line.selectedProduct, line.selectedAdditions)"
                            style="padding:4px 10px;border-radius:9999px;font-size:.7rem;font-weight:600;cursor:pointer;
                                   background:rgba(var(--ion-color-secondary-rgb),.12);color:var(--ion-color-secondary)">
                        <ion-icon name="add-circle-outline" style="font-size:.8rem;vertical-align:-1px" />
                        + Adición
                      </span>
                    }
                  </div>
                }
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
                        style="padding:10px 16px;font-size:.875rem;cursor:pointer;border-bottom:1px solid var(--ion-color-light)"
                        (click)="selectProduct(line.id, p)"
                      >
                        <span style="color:var(--ion-color-dark);font-weight:500">{{ p.name }}</span>
                        <span style="color:var(--ion-color-medium)"> — $ {{ p.basePrice | number:'1.0-0' }}</span>
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
            <div style="padding:14px 16px 4px;font-size:.75rem;font-weight:600;color:var(--ion-color-medium);letter-spacing:.05em;text-transform:uppercase">
              Resumen
            </div>
            @for (line of orderLines(); track line.id) {
              @if (line.selectedProduct) {
                <div style="display:flex;justify-content:space-between;padding:4px 16px;font-size:.875rem;color:var(--ion-color-dark)">
                  <span>{{ line.selectedProduct.name }} ×{{ line.quantity }}</span>
                  <span>$ {{ lineUnitPrice(line) * line.quantity | number:'1.0-0' }}</span>
                </div>
              }
            }
            <div style="border-top:1px solid var(--ion-color-light);margin:8px 16px 0"></div>
            <div style="display:flex;justify-content:space-between;padding:6px 16px;font-size:.8rem;color:var(--ion-color-medium)">
              <span>Subtotal (base)</span>
              <span>$ {{ orderSubtotal() | number:'1.0-0' }}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 16px;font-size:.8rem;color:var(--ion-color-medium)">
              <span>Propina</span>
              <span style="display:flex;align-items:center;gap:4px">
                $ {{ orderTip() | number:'1.0-0' }}
                <ion-button fill="clear" size="small" (click)="openTipDialog()"
                            style="margin:0;--padding-start:4px;--padding-end:4px;height:20px">
                  <ion-icon slot="icon-only" name="pencil-outline" style="font-size:.9rem" />
                </ion-button>
              </span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:10px 16px 14px;font-size:1rem;font-weight:700;color:var(--ion-color-dark)">
              <span>Total a cobrar</span>
              <span>$ {{ orderTotal() | number:'1.0-0' }}</span>
            </div>
            <div style="padding:0 16px 16px">
              <ion-item style="--border-radius:8px">
                <ion-label position="stacked">Observaciones</ion-label>
                <ion-textarea
                  [value]="observations()"
                  (ionInput)="onObservationsInput($event)"
                  placeholder="Ej: sin azúcar, alergia a nueces..."
                  autoGrow
                  rows="2"
                />
              </ion-item>
            </div>
          </div>
        }
      </ion-content>

      <ion-footer>
        <ion-toolbar style="--background:var(--ion-background-color);--border-color:var(--ion-color-light)">
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

    @if (tipEditOpen()) {
      <div style="position:fixed;inset:0;z-index:1000;background:rgba(35,12,0,.45);
                  display:flex;align-items:center;justify-content:center;padding:16px"
           (click)="closeTipDialog()">
        <div style="background:#ffffff;border-radius:16px;width:100%;max-width:320px;
                    box-shadow:0 8px 24px rgba(35,12,0,.25);overflow:hidden"
             (click)="$event.stopPropagation()">
          <div style="padding:16px 16px 4px;font-size:1rem;font-weight:700;color:var(--ion-color-dark)">
            Editar propina
          </div>
          <div style="padding:8px 16px">
            <ion-item style="--border-radius:8px;margin-bottom:8px">
              <ion-label position="stacked">Porcentaje</ion-label>
              <ion-input
                type="number"
                inputmode="decimal"
                [value]="tipEditPercentageInput()"
                (ionInput)="onTipPercentageInput($event)"
              />
            </ion-item>
            <ion-item style="--border-radius:8px">
              <ion-label position="stacked">Valor</ion-label>
              <ion-input
                type="number"
                inputmode="decimal"
                [value]="tipEditValueInput()"
                (ionInput)="onTipValueInput($event)"
              />
            </ion-item>
          </div>
          <div style="display:flex;gap:8px;padding:12px 16px 16px">
            <ion-button expand="block" fill="outline" style="flex:1" (click)="closeTipDialog()">
              Cancelar
            </ion-button>
            <ion-button expand="block" color="secondary" style="flex:1" (click)="confirmTipDialog()">
              Aceptar
            </ion-button>
          </div>
        </div>
      </div>
    }
  `,
})
export class WaiterComponent {
  readonly authService = inject(AuthService);
  readonly orderService = inject(OrderService);
  private readonly productService = inject(ProductService);
  private readonly toastCtrl = inject(ToastController);
  private readonly actionSheetCtrl = inject(ActionSheetController);
  private readonly alertCtrl = inject(AlertController);

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
  observations = signal('');
  private lineCounter = 0;
  private readonly _orderLines = signal<OrderLine[]>([]);
  readonly orderLines = this._orderLines.asReadonly();

  submitting = signal(false);
  private readonly _submitError = signal('');

  // Línea con producto que tiene variantes pero aún no se eligió ninguna;
  // bloquea el envío del pedido.
  private readonly missingVariantLine = computed(
    () =>
      this._orderLines().find(
        (l) => l.selectedProduct && l.selectedProduct.variants.length > 0 && !l.selectedVariant,
      ) ?? null,
  );

  // Se mantiene como una función invocable (submitError()) para no romper
  // el template: combina el error async de submitOrder() con el bloqueo
  // por variante pendiente, que tiene prioridad porque impide el envío.
  readonly submitError = computed(() => {
    const missing = this.missingVariantLine();
    return missing ? `Selecciona una variante para: ${missing.selectedProduct!.name}` : this._submitError();
  });

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
      .reduce((s, l) => s + this.lineUnitPrice(l) * l.quantity, 0),
  );

  // Propina editable por el mesero antes de enviar el pedido (Tarea 31).
  // computeOrderTotals() es la misma función pura que persiste
  // OrderService.createOrder(), para que el número que ve el mesero antes de
  // enviar el pedido sea exactamente el que queda guardado.
  readonly tipPercentage = signal(10);
  readonly tipValue = signal(0);
  private readonly orderTotals = computed(() =>
    computeOrderTotals(this.orderSubtotal(), this.tipPercentage(), this.tipValue()),
  );
  readonly orderTip = computed(() => this.orderTotals().tipAmount);
  readonly orderTotal = computed(() => this.orderTotals().total);

  readonly canSubmit = computed(
    () =>
      this.orderIdentifier().trim().length > 0 &&
      this.hasSelectedProducts() &&
      this.missingVariantLine() === null &&
      !this.submitting(),
  );

  // Precio unitario real de una línea: basePrice + Σ additionPrice de las
  // adiciones elegidas. Se centraliza aquí porque se usa tanto en el
  // subtotal del pedido como en cada tarjeta de línea y en el resumen.
  lineUnitPrice(line: OrderLine): number {
    if (!line.selectedProduct) return 0;
    return (
      line.selectedProduct.basePrice +
      line.selectedAdditions.reduce((sum, a) => sum + a.additionPrice, 0)
    );
  }

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
      optionsOutline,
      personCircleOutline,
      timeOutline,
      cardOutline,
      cashOutline,
      qrCodeOutline,
      pencilOutline,
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
    this.observations.set('');
    this.tipPercentage.set(10);
    this.tipValue.set(0);
    this._submitError.set('');
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

  // Overlay propio de edición de propina (AlertController no soporta labels
  // visibles en inputs de tipo texto/número, solo en radio/checkbox — ver
  // alert-interface.d.ts de @ionic/core). tipEditOrder null = se está editando
  // la propina del pedido nuevo (antes de enviar); si tiene un Order, se está
  // editando la propina de un pedido ya creado.
  readonly tipEditOpen = signal(false);
  readonly tipEditOrder = signal<Order | null>(null);
  readonly tipEditPercentageInput = signal('10');
  readonly tipEditValueInput = signal('0');

  openTipDialog(): void {
    this.tipEditOrder.set(null);
    this.tipEditPercentageInput.set(String(this.tipPercentage()));
    this.tipEditValueInput.set(String(this.tipValue()));
    this.tipEditOpen.set(true);
  }

  // Solo aplica a pedidos aún no cobrados (order.paid === false); una vez
  // cobrado el pedido queda inmutable.
  editOrderTip(order: Order, event: Event): void {
    event.stopPropagation();
    this.tipEditOrder.set(order);
    this.tipEditPercentageInput.set(String(order.tipPercentage));
    this.tipEditValueInput.set(String(order.tipValue));
    this.tipEditOpen.set(true);
  }

  onTipPercentageInput(event: Event): void {
    this.tipEditPercentageInput.set(
      (event as CustomEvent<{ value: string | null | undefined }>).detail.value ?? '',
    );
  }

  onTipValueInput(event: Event): void {
    this.tipEditValueInput.set(
      (event as CustomEvent<{ value: string | null | undefined }>).detail.value ?? '',
    );
  }

  closeTipDialog(): void {
    this.tipEditOpen.set(false);
  }

  async confirmTipDialog(): Promise<void> {
    const order = this.tipEditOrder();
    const fallbackPercentage = order ? order.tipPercentage : this.tipPercentage();
    const fallbackValue = order ? order.tipValue : this.tipValue();
    const parsedPercentage = Number(this.tipEditPercentageInput());
    const parsedValue = Number(this.tipEditValueInput());
    const percentage =
      this.tipEditPercentageInput() === '' || Number.isNaN(parsedPercentage)
        ? fallbackPercentage
        : parsedPercentage;
    const value =
      this.tipEditValueInput() === '' || Number.isNaN(parsedValue) ? fallbackValue : parsedValue;

    this.tipEditOpen.set(false);
    if (order) {
      const { tipAmount, total } = computeOrderTotals(order.subtotal, percentage, value);
      await this.orderService.updateOrderTip(order.id, {
        tipPercentage: percentage,
        tipValue: value,
        tipAmount,
        total,
      });
    } else {
      this.tipPercentage.set(percentage);
      this.tipValue.set(value);
    }
  }

  timeAgo(timestamp: Timestamp): string {
    const mins = Math.floor((Date.now() - timestamp.toDate().getTime()) / 60000);
    if (mins < 1) return 'ahora mismo';
    if (mins < 60) return `hace ${mins} min`;
    return `hace ${Math.floor(mins / 60)} h`;
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
      {
        id: ++this.lineCounter,
        query: '',
        filteredProducts: [],
        selectedProduct: null,
        quantity: 1,
        selectedVariant: null,
        selectedAdditions: [],
      },
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

  async selectProduct(lineId: number, product: Product): Promise<void> {
    this._orderLines.update((lines) =>
      lines.map((l) =>
        l.id === lineId
          ? {
              ...l,
              selectedProduct: product,
              query: '',
              filteredProducts: [],
              // Se resetea la selección previa al cambiar de producto.
              selectedVariant: null,
              selectedAdditions: [],
            }
          : l,
      ),
    );
    if (product.variants.length > 0) {
      await this.openVariantSheet(lineId, product);
    }
  }

  // El action sheet no incluye botón "Cancelar": si el mesero lo cierra sin
  // elegir, la línea queda con selectedVariant en null y canSubmit() la
  // bloquea, en vez de dejar pasar un pedido sin variante obligatoria.
  async openVariantSheet(lineId: number, product: Product): Promise<void> {
    const sheet = await this.actionSheetCtrl.create({
      header: 'Elige la variante',
      buttons: product.variants.map((variant) => ({
        text: variant,
        data: { variant },
      })),
    });
    await sheet.present();
    const { data } = await sheet.onWillDismiss<{ variant: string }>();
    if (!data) return;
    this._orderLines.update((lines) =>
      lines.map((l) => (l.id === lineId ? { ...l, selectedVariant: data.variant } : l)),
    );
  }

  async openAdditionsAlert(
    lineId: number,
    product: Product,
    current: ProductAddition[],
  ): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Elige las adiciones',
      inputs: product.additions.map((addition) => ({
        type: 'checkbox' as const,
        label: `${addition.addition} (+$${addition.additionPrice})`,
        value: addition,
        checked: current.some((c) => c.addition === addition.addition),
      })),
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Aceptar', role: 'confirm' },
      ],
    });
    await alert.present();
    const { data, role } = await alert.onWillDismiss<{ values: ProductAddition[] }>();
    if (role !== 'confirm' || !data) return;
    this._orderLines.update((lines) =>
      lines.map((l) => (l.id === lineId ? { ...l, selectedAdditions: data.values ?? [] } : l)),
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

  onObservationsInput(event: Event): void {
    this.observations.set(
      (event as CustomEvent<{ value: string | null | undefined }>).detail.value ?? '',
    );
  }

  async submitOrder(): Promise<void> {
    const identifier = this.orderIdentifier().trim();
    if (!identifier || !this.hasSelectedProducts()) return;
    this.submitting.set(true);
    this._submitError.set('');
    try {
      const items: OrderItem[] = this._orderLines()
        .filter((l) => l.selectedProduct !== null)
        .map((l) => ({
          productId: l.selectedProduct!.id,
          productName: l.selectedProduct!.name,
          quantity: l.quantity,
          variant: l.selectedVariant,
          additions: l.selectedAdditions,
          unitPrice: this.lineUnitPrice(l),
          itemStatus: 'pending' as const,
        }));
      await this.orderService.createOrder(
        identifier,
        items,
        this.observations().trim(),
        this.tipPercentage(),
        this.tipValue(),
      );
      this.view.set('dashboard');
    } catch (err) {
      console.error('[submitOrder] createOrder failed:', err);
      this._submitError.set('No se pudo crear el pedido. Intenta de nuevo.');
    } finally {
      this.submitting.set(false);
    }
  }
}
