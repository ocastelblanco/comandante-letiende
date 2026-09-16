import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, effect, inject, Input, OnInit, output, signal } from '@angular/core';
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
import { Product, ProductCategory, ProductSubcategory } from '../../../core/models/product.model';
import { CATEGORY_TREE, categoryRequiresSubcategory, getCategoryNode } from '../../../core/models/category-tree';

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
          @for (cat of categoryOptions; track cat.value) {
            <ion-select-option [value]="cat.value">{{ cat.label }}</ion-select-option>
          }
        </ion-select>
      </ion-item>

      @if (subcategoryOptions().length > 0) {
        <ion-item>
          <ion-label position="stacked">Subcategoría *</ion-label>
          <ion-select formControlName="subcategory" placeholder="Seleccionar">
            @for (sub of subcategoryOptions(); track sub.value) {
              <ion-select-option [value]="sub.value">{{ sub.label }}</ion-select-option>
            }
          </ion-select>
        </ion-item>
      }

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

  protected readonly categoryOptions = CATEGORY_TREE;

  form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    category: ['bebidas' as ProductCategory, Validators.required],
    subcategory: this.fb.control<ProductSubcategory | null>(null),
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

  private readonly selectedCategory = computed(
    () => this.formValues().category ?? ('bebidas' as ProductCategory),
  );

  protected readonly subcategoryOptions = computed(
    () => getCategoryNode(this.selectedCategory())?.subcategories ?? [],
  );

  constructor() {
    // Mantiene la subcategoría sincronizada con la categoría seleccionada:
    // aplica/quita el validador requerido y limpia el valor cuando deja de
    // ser válido para la nueva categoría (o cuando la categoría no admite
    // subcategorías).
    effect(() => {
      const category = this.selectedCategory();
      const requiresSub = categoryRequiresSubcategory(category);
      const subCtrl = this.form.controls.subcategory;
      const currentSub = subCtrl.value;
      const validSubs = getCategoryNode(category)?.subcategories ?? [];

      if (requiresSub) {
        subCtrl.setValidators([Validators.required]);
        if (currentSub && !validSubs.some((s) => s.value === currentSub)) {
          subCtrl.setValue(null, { emitEvent: false });
        }
      } else {
        subCtrl.clearValidators();
        if (currentSub !== null) {
          subCtrl.setValue(null, { emitEvent: false });
        }
      }
      subCtrl.updateValueAndValidity({ emitEvent: false });
    });
  }

  ngOnInit(): void {
    if (this.product) {
      this.form.patchValue({
        name: this.product.name,
        category: this.product.category,
        subcategory: this.product.subcategory ?? null,
        basePrice: this.product.basePrice,
        tipAmount: this.product.tipAmount,
      });
    }
  }

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    this.saving.set(true);
    try {
      const { name, category, subcategory, basePrice, tipAmount } = this.form.getRawValue();
      const data = {
        name,
        category,
        // Se guarda `null` explícito cuando la categoría no admite
        // subcategoría para limpiar cualquier valor previo en Firestore.
        subcategory: categoryRequiresSubcategory(category) ? subcategory : null,
        basePrice,
        tipAmount,
        totalPrice: this.totalPrice(),
        isActive: true,
      };
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
