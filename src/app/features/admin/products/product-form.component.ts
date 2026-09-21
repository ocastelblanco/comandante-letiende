import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, effect, inject, Input, OnInit, output, signal } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
  IonTextarea,
  ToastController,
} from '@ionic/angular/standalone';
import { DecimalPipe } from '@angular/common';
import { ProductService } from '../../../core/db/product.service';
import { Product, ProductCategory, ProductSubcategory } from '../../../core/models/product.model';
import { CATEGORY_TREE, categoryRequiresSubcategory, getCategoryNode } from '../../../core/models/category-tree';

type AdditionGroup = FormGroup<{
  addition: FormControl<string>;
  additionPrice: FormControl<number>;
}>;

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DecimalPipe,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonSpinner,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()">
      <ion-item>
        <ion-label position="stacked">Nombre *</ion-label>
        <ion-input formControlName="name" placeholder="Ej. Mojito" />
      </ion-item>

      <ion-item>
        <ion-label position="stacked">Descripción</ion-label>
        <ion-textarea formControlName="description" placeholder="Para la carta impresa y digital" [autoGrow]="true" rows="2" />
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

      <!-- Variantes: opciones excluyentes que NO alteran el precio -->
      <div class="px-4 pt-4">
        <p style="font-size:.72rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
                  color:var(--ion-color-medium);margin:0 0 6px">
          Variantes
        </p>
        @if (variantsArray.controls.length > 0) {
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px">
            @for (ctrl of variantsArray.controls; track $index) {
              <span style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;
                           border-radius:9999px;background:var(--ion-color-light);
                           font-size:.8rem;color:var(--ion-color-dark)">
                {{ ctrl.value }}
                <button type="button" (click)="removeVariant($index)"
                        style="border:none;background:none;cursor:pointer;color:var(--ion-color-danger);
                               font-size:.85rem;line-height:1;padding:0">✕</button>
              </span>
            }
          </div>
        }
        <div style="display:flex;gap:8px">
          <input [value]="newVariantName()"
                 (input)="newVariantName.set($any($event.target).value)"
                 (keydown.enter)="$event.preventDefault(); addVariant()"
                 placeholder="Ej. amber_ale"
                 style="flex:1;border:1px solid var(--ion-color-light);border-radius:8px;
                        padding:8px 10px;font-size:.85rem" />
          <ion-button type="button" fill="outline" size="small" (click)="addVariant()">+ Añadir</ion-button>
        </div>
      </div>

      <!-- Adiciones: extras opcionales que SÍ suman al precio base -->
      <div class="px-4 pt-4">
        <p style="font-size:.72rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
                  color:var(--ion-color-medium);margin:0 0 6px">
          Adiciones
        </p>
        @if (additionsArray.controls.length > 0) {
          <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:8px">
            @for (group of additionsArray.controls; track $index) {
              <div style="display:flex;align-items:center;justify-content:space-between;
                          padding:6px 10px;border-radius:8px;background:var(--ion-color-light)">
                <span style="font-size:.85rem;color:var(--ion-color-dark)">
                  {{ group.controls.addition.value }} — $ {{ group.controls.additionPrice.value | number:'1.0-0' }}
                </span>
                <button type="button" (click)="removeAddition($index)"
                        style="border:none;background:none;cursor:pointer;color:var(--ion-color-danger);
                               font-size:.85rem;line-height:1;padding:0">✕</button>
              </div>
            }
          </div>
        }
        <div style="display:flex;gap:8px">
          <input [value]="newAdditionName()"
                 (input)="newAdditionName.set($any($event.target).value)"
                 placeholder="Ej. leche_vegetal"
                 style="flex:1;border:1px solid var(--ion-color-light);border-radius:8px;
                        padding:8px 10px;font-size:.85rem" />
          <input type="number" min="0"
                 [value]="newAdditionPrice()"
                 (input)="onNewAdditionPriceInput($any($event.target).value)"
                 placeholder="Precio"
                 style="width:96px;border:1px solid var(--ion-color-light);border-radius:8px;
                        padding:8px 10px;font-size:.85rem" />
          <ion-button type="button" fill="outline" size="small" (click)="addAddition()">+ Añadir</ion-button>
        </div>
      </div>

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
  private toastCtrl = inject(ToastController);

  @Input() product?: Product;
  saved = output<void>();
  cancelled = output<void>();

  saving = signal(false);

  protected readonly categoryOptions = CATEGORY_TREE;

  protected readonly variantsArray = new FormArray<FormControl<string>>([]);
  protected readonly additionsArray = new FormArray<AdditionGroup>([]);

  // Staging fields para los inputs de "añadir variante/adición" — no forman
  // parte del formulario reactivo, solo controlan el input antes de empujar
  // el valor al FormArray correspondiente.
  protected readonly newVariantName = signal('');
  protected readonly newAdditionName = signal('');
  protected readonly newAdditionPrice = signal<number | null>(null);

  form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    description: [''],
    category: ['bebidas' as ProductCategory, Validators.required],
    subcategory: this.fb.control<ProductSubcategory | null>(null),
    basePrice: [0, [Validators.required, Validators.min(0)]],
    variants: this.variantsArray,
    additions: this.additionsArray,
  });

  private readonly formValues = toSignal(
    this.form.valueChanges.pipe(startWith(this.form.getRawValue())),
    { initialValue: this.form.getRawValue() },
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
        description: this.product.description ?? '',
        category: this.product.category,
        subcategory: this.product.subcategory ?? null,
        basePrice: this.product.basePrice,
      });
      for (const variant of this.product.variants) {
        this.variantsArray.push(new FormControl(variant, { nonNullable: true, validators: Validators.required }));
      }
      for (const addition of this.product.additions) {
        this.additionsArray.push(this.buildAdditionGroup(addition.addition, addition.additionPrice));
      }
    }
  }

  protected addVariant(): void {
    const value = this.newVariantName().trim();
    if (!value) return;
    if (this.variantsArray.controls.some((c) => c.value.toLowerCase() === value.toLowerCase())) return;
    this.variantsArray.push(new FormControl(value, { nonNullable: true, validators: Validators.required }));
    this.newVariantName.set('');
  }

  protected removeVariant(index: number): void {
    this.variantsArray.removeAt(index);
  }

  protected onNewAdditionPriceInput(value: string): void {
    this.newAdditionPrice.set(value === '' ? null : Number(value));
  }

  protected addAddition(): void {
    const name = this.newAdditionName().trim();
    const price = this.newAdditionPrice();
    if (!name || price === null || !isFinite(price) || price < 0) return;
    if (this.additionsArray.controls.some((g) => g.controls.addition.value.toLowerCase() === name.toLowerCase())) return;
    this.additionsArray.push(this.buildAdditionGroup(name, price));
    this.newAdditionName.set('');
    this.newAdditionPrice.set(null);
  }

  protected removeAddition(index: number): void {
    this.additionsArray.removeAt(index);
  }

  private buildAdditionGroup(addition: string, additionPrice: number): AdditionGroup {
    return this.fb.nonNullable.group({
      addition: [addition, Validators.required],
      additionPrice: [additionPrice, [Validators.required, Validators.min(0)]],
    });
  }

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    this.saving.set(true);
    try {
      const { name, description, category, subcategory, basePrice, variants, additions } = this.form.getRawValue();
      const data = {
        name,
        description: description.trim() === '' ? null : description.trim(),
        category,
        // Se guarda `null` explícito cuando la categoría no admite
        // subcategoría para limpiar cualquier valor previo en Firestore.
        subcategory: categoryRequiresSubcategory(category) ? subcategory : null,
        variants,
        additions,
        basePrice,
        isActive: true,
      };
      if (this.product) {
        await this.productService.updateProduct(this.product.id, data);
      } else {
        await this.productService.addProduct(data);
      }
      this.saved.emit();
    } catch {
      // No se emite `saved` ni se cierra el modal: el usuario puede corregir
      // los datos y reintentar (ej. rechazo de firestore.rules).
      this.toastCtrl
        .create({
          message: 'No se pudo guardar el producto. Verifica los datos e intenta de nuevo.',
          duration: 5000,
          position: 'top',
          color: 'danger',
        })
        .then((t) => t.present());
    } finally {
      this.saving.set(false);
    }
  }
}
