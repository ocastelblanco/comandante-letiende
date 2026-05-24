import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, Input, OnInit, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import {
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
} from '@ionic/angular/standalone';
import { DecimalPipe } from '@angular/common';
import { ProductService } from '../../../core/db/product.service';
import { Product, ProductCategory } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DecimalPipe,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonSpinner,
    IonText,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()">
      <ion-item>
        <ion-label position="stacked">Nombre *</ion-label>
        <ion-input formControlName="name" placeholder="Ej. Mojito" />
      </ion-item>

      <ion-item>
        <ion-label position="stacked">Categoría *</ion-label>
        <ion-select formControlName="category" placeholder="Seleccionar">
          <ion-select-option value="bebidas">Bebidas</ion-select-option>
          <ion-select-option value="licores">Licores</ion-select-option>
          <ion-select-option value="comida">Comida</ion-select-option>
          <ion-select-option value="otros">Otros</ion-select-option>
        </ion-select>
      </ion-item>

      <ion-item>
        <ion-label position="stacked">Precio base (COP) *</ion-label>
        <ion-input type="number" formControlName="basePrice" min="0" />
      </ion-item>

      <ion-item>
        <ion-label position="stacked">Propina (COP) *</ion-label>
        <ion-input type="number" formControlName="tipAmount" min="0" />
      </ion-item>

      <ion-item lines="none">
        <ion-label>Total cobro en datáfono</ion-label>
        <ion-text slot="end" class="font-bold text-lg">
          $&nbsp;{{ totalPrice() | number : '1.0-0' }}
        </ion-text>
      </ion-item>

      <div class="flex gap-2 px-4 pt-4">
        <ion-button expand="block" type="submit" [disabled]="form.invalid || saving()">
          @if (saving()) {
            <ion-spinner name="crescent" />
          } @else {
            {{ product ? 'Actualizar' : 'Crear' }}
          }
        </ion-button>
        <ion-button expand="block" fill="outline" type="button" (click)="cancelled.emit()">
          Cancelar
        </ion-button>
      </div>
    </form>
  `,
})
export class ProductFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);

  @Input() product?: Product;
  saved = output<void>();
  cancelled = output<void>();

  saving = signal(false);

  form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    category: ['bebidas' as ProductCategory, Validators.required],
    basePrice: [0, [Validators.required, Validators.min(0)]],
    tipAmount: [0, [Validators.required, Validators.min(0)]],
  });

  private readonly formValues = toSignal(
    this.form.valueChanges.pipe(startWith(this.form.getRawValue())),
    { initialValue: this.form.getRawValue() },
  );

  readonly totalPrice = computed(
    () => (this.formValues().basePrice ?? 0) + (this.formValues().tipAmount ?? 0),
  );

  ngOnInit(): void {
    if (this.product) {
      this.form.patchValue({
        name: this.product.name,
        category: this.product.category,
        basePrice: this.product.basePrice,
        tipAmount: this.product.tipAmount,
      });
    }
  }

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    this.saving.set(true);
    try {
      const { name, category, basePrice, tipAmount } = this.form.getRawValue();
      const data = { name, category, basePrice, tipAmount, totalPrice: this.totalPrice(), isActive: true };
      if (this.product) {
        await this.productService.updateProduct(this.product.id, data);
      } else {
        await this.productService.addProduct(data);
      }
      this.saved.emit();
    } finally {
      this.saving.set(false);
    }
  }
}
