import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
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
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addCircleOutline,
  checkmarkCircleOutline,
  removeCircleOutline,
  trashOutline,
} from 'ionicons/icons';
import { OrderService } from '../../core/db/order.service';
import { ProductService } from '../../core/db/product.service';
import { OrderItem } from '../../core/models/order-item.model';
import { Product, ProductCategory } from '../../core/models/product.model';

interface CartEntry {
  productId: string;
  name: string;
  unitPrice: number;
  tipAmount: number;
  qty: number;
}

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  bebidas: 'Bebidas',
  licores: 'Licores',
  comida: 'Comida',
  otros: 'Otros',
};

@Component({
  selector: 'app-waiter',
  standalone: true,
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
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
    <ion-header>
      <ion-toolbar>
        <ion-title>Mesero</ion-title>
        @if (cartItemCount() > 0) {
          <ion-buttons slot="end">
            <ion-button fill="clear" (click)="clearCart()">
              <ion-icon slot="icon-only" name="trash-outline" />
            </ion-button>
          </ion-buttons>
        }
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (orderSent()) {
        <ion-item color="success">
          <ion-icon slot="start" name="checkmark-circle-outline" />
          <ion-label>Pedido enviado correctamente.</ion-label>
        </ion-item>
      }

      @if (!hasProducts()) {
        <ion-item>
          <ion-label>No hay productos activos en el catálogo.</ion-label>
        </ion-item>
      } @else {
        @for (category of categories(); track category) {
          <ion-list-header>
            <ion-label>{{ categoryLabels[category] }}</ion-label>
          </ion-list-header>
          <ion-list>
            @for (p of productsByCategory()[category]; track p.id) {
              <ion-item>
                <ion-label>
                  <h2>{{ p.name }}</h2>
                  <p>$ {{ p.totalPrice | number : '1.0-0' }}</p>
                </ion-label>
                <div slot="end" style="display:flex;align-items:center;gap:4px">
                  @if (qty(p.id) > 0) {
                    <ion-button fill="clear" size="small" (click)="decrement(p.id)">
                      <ion-icon slot="icon-only" name="remove-circle-outline" />
                    </ion-button>
                    <span style="min-width:1.5rem;text-align:center;font-weight:600">
                      {{ qty(p.id) }}
                    </span>
                  }
                  <ion-button fill="clear" size="small" (click)="increment(p)">
                    <ion-icon slot="icon-only" name="add-circle-outline" />
                  </ion-button>
                </div>
              </ion-item>
            }
          </ion-list>
        }
      }
    </ion-content>

    @if (cartItemCount() > 0) {
      <ion-footer>
        <ion-toolbar>
          @if (showTableForm()) {
            <form [formGroup]="orderForm" (ngSubmit)="submitOrder()" style="padding:8px 16px">
              <ion-item lines="none">
                <ion-label position="stacked">Mesa / Identificador *</ion-label>
                <ion-input formControlName="tableNumber" placeholder="Ej: Mesa 3" />
              </ion-item>
              @if (submitError()) {
                <ion-note color="danger" style="padding:0 16px 8px;display:block">
                  {{ submitError() }}
                </ion-note>
              }
              <div style="display:flex;gap:8px;padding:8px 0">
                <ion-button
                  expand="block"
                  type="submit"
                  [disabled]="orderForm.invalid || submitting()"
                >
                  @if (submitting()) {
                    <ion-spinner name="crescent" />
                  } @else {
                    Confirmar · $ {{ cartTotal() | number : '1.0-0' }}
                  }
                </ion-button>
                <ion-button
                  expand="block"
                  fill="outline"
                  type="button"
                  (click)="showTableForm.set(false)"
                >
                  Cancelar
                </ion-button>
              </div>
            </form>
          } @else {
            <div
              style="padding:8px 16px;display:flex;justify-content:space-between;align-items:center"
            >
              <span>
                {{ cartItemCount() }} artículo{{ cartItemCount() !== 1 ? 's' : '' }} ·
                $ {{ cartTotal() | number : '1.0-0' }}
              </span>
              <ion-button (click)="showTableForm.set(true)">Enviar pedido</ion-button>
            </div>
          }
        </ion-toolbar>
      </ion-footer>
    }
  `,
})
export class WaiterComponent {
  private readonly productService = inject(ProductService);
  private readonly orderService = inject(OrderService);
  private readonly fb = inject(FormBuilder);

  readonly categoryLabels = CATEGORY_LABELS;

  private readonly _cart = signal<Record<string, CartEntry>>({});

  readonly cartItems = computed(() => Object.values(this._cart()));
  readonly cartItemCount = computed(() => this.cartItems().reduce((s, e) => s + e.qty, 0));
  readonly cartTotal = computed(() =>
    this.cartItems().reduce((s, e) => s + e.unitPrice * e.qty, 0),
  );

  readonly hasProducts = computed(() => this.productService.activeProducts().length > 0);

  readonly categories = computed(() => {
    const seen = new Set<ProductCategory>();
    for (const p of this.productService.activeProducts()) seen.add(p.category);
    return [...seen];
  });

  readonly productsByCategory = computed(() => {
    const grouped: Record<ProductCategory, Product[]> = {
      bebidas: [],
      licores: [],
      comida: [],
      otros: [],
    };
    for (const p of this.productService.activeProducts()) {
      grouped[p.category].push(p);
    }
    return grouped;
  });

  showTableForm = signal(false);
  submitting = signal(false);
  submitError = signal('');
  orderSent = signal(false);

  orderForm = this.fb.nonNullable.group({
    tableNumber: ['', Validators.required],
  });

  constructor() {
    addIcons({ addCircleOutline, removeCircleOutline, trashOutline, checkmarkCircleOutline });
  }

  qty(productId: string): number {
    return this._cart()[productId]?.qty ?? 0;
  }

  increment(product: Product): void {
    const current = this._cart();
    const entry = current[product.id];
    this._cart.set({
      ...current,
      [product.id]: entry
        ? { ...entry, qty: entry.qty + 1 }
        : {
            productId: product.id,
            name: product.name,
            unitPrice: product.totalPrice,
            tipAmount: product.tipAmount,
            qty: 1,
          },
    });
  }

  decrement(productId: string): void {
    const current = { ...this._cart() };
    const entry = current[productId];
    if (!entry) return;
    if (entry.qty <= 1) {
      delete current[productId];
    } else {
      current[productId] = { ...entry, qty: entry.qty - 1 };
    }
    this._cart.set(current);
  }

  clearCart(): void {
    this._cart.set({});
    this.showTableForm.set(false);
    this.submitError.set('');
  }

  async submitOrder(): Promise<void> {
    if (this.orderForm.invalid) return;
    this.submitting.set(true);
    this.submitError.set('');
    try {
      const { tableNumber } = this.orderForm.getRawValue();
      const items: OrderItem[] = this.cartItems().map((e) => ({
        productId: e.productId,
        productName: e.name,
        quantity: e.qty,
        unitPrice: e.unitPrice,
        tipAmount: e.tipAmount,
      }));
      await this.orderService.createOrder(tableNumber, items);
      this.clearCart();
      this.orderForm.reset();
      this.orderSent.set(true);
      setTimeout(() => this.orderSent.set(false), 4000);
    } catch {
      this.submitError.set('No se pudo enviar el pedido. Intenta de nuevo.');
    } finally {
      this.submitting.set(false);
    }
  }
}
