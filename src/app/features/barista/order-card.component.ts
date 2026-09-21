import { Component, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { IonButton } from '@ionic/angular/standalone';
import { Order } from '../../core/models/order.model';
import { OrderItem } from '../../core/models/order-item.model';

// Card de pedido reutilizable entre las secciones "Por preparar" y
// "En preparación" de la barra: antes era HTML duplicado en barista.component.ts.
@Component({
  selector: 'app-order-card',
  standalone: true,
  imports: [DecimalPipe, IonButton],
  template: `
    <div class="bg-white rounded-2xl shadow-[0_1px_3px_rgba(35,12,0,0.12)] overflow-hidden"
         [style.border-left]="'4px solid ' + borderColor()">
      <div class="p-4">
        <div class="flex items-baseline justify-between mb-1">
          <span class="text-lg font-bold text-espresso">
            Pedido: {{ order().tableNumber }}
          </span>
          <span class="text-sm font-bold text-espresso">
            &#36;{{ order().total | number:'1.0-0' }}
          </span>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin:0 0 8px">
          <p style="font-size:.75rem;color:rgba(var(--ion-color-primary-rgb),0.45);margin:0">{{ order().waiterName }}</p>
          @if (order().paid) {
            <span style="font-size:.65rem;font-weight:700;padding:2px 8px;border-radius:9999px;
                         background:rgba(0,183,163,.15);color:var(--ion-color-tertiary)">✓ Pagado</span>
          } @else {
            <span style="font-size:.65rem;font-weight:700;padding:2px 8px;border-radius:9999px;
                         background:rgba(232,99,10,.12);color:var(--ion-color-secondary)">Sin cobrar</span>
          }
        </div>
        <div class="flex flex-wrap gap-1.5 mb-4">
          @for (item of order().items; track item.productId) {
            <span class="bg-surface text-espresso text-xs font-semibold
                         px-2.5 py-1 rounded-full">
              {{ itemLabel(item) }}
            </span>
          }
        </div>
        @if (order().observations) {
          <div class="bg-cream/50 rounded-xl px-3 py-2 mb-4 flex gap-2 items-start">
            <span style="font-size:.9rem;line-height:1.2">📝</span>
            <p class="text-xs text-espresso/70 italic">{{ order().observations }}</p>
          </div>
        }
        <ion-button expand="block" [color]="actionColor()" class="btn-rounded"
                    (click)="action.emit()">
          {{ actionLabel() }}
        </ion-button>
      </div>
    </div>
  `,
})
export class OrderCardComponent {
  readonly order = input.required<Order>();
  readonly actionLabel = input.required<string>();
  readonly actionColor = input.required<string>();
  readonly borderColor = input.required<string>();
  readonly action = output<void>();

  // Arma el texto de la chip incluyendo variante y adiciones cuando existan,
  // para que la barra sepa exactamente cómo preparar el ítem.
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
}
