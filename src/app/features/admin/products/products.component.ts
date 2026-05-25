import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';
import { ProductService } from '../../../core/db/product.service';
import { Product, ProductCategory } from '../../../core/models/product.model';
import { ProductFormComponent } from './product-form.component';

const CATEGORIES: { value: string; label: string }[] = [
  { value: 'all',     label: 'Todos'   },
  { value: 'bebidas', label: 'Bebidas' },
  { value: 'licores', label: 'Licores' },
  { value: 'comida',  label: 'Comida'  },
  { value: 'otros',   label: 'Otros'   },
];

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    DecimalPipe,
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon,
    IonTitle,
    IonToolbar,
    ProductFormComponent,
  ],
  styles: [`
    :host { display: block; height: 100%; }
    @media (min-width: 1024px) { ion-header { display: none; } }
  `],
  template: `
    <!-- Form overlay (outside ion-content to avoid scroll stacking context) -->
    @if (showForm()) {
      <div style="position:fixed;inset:0;z-index:1000;background:rgba(35,12,0,0.45);
                  display:flex;align-items:flex-end;justify-content:center;padding:16px"
           class="lg:items-center">
        <div class="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
          <div class="flex items-center justify-between px-5 py-4
                      border-b border-[#230C00]/8">
            <h2 class="font-semibold text-[#230C00]">
              {{ editingProduct() ? 'Editar producto' : 'Nuevo producto' }}
            </h2>
            <button (click)="showForm.set(false)"
                    class="text-[#230C00]/45 hover:text-[#230C00] text-xl leading-none
                           w-8 h-8 flex items-center justify-center rounded-full
                           hover:bg-[#230C00]/8 transition-colors">
              ✕
            </button>
          </div>
          <div class="p-5">
            <app-product-form
              [product]="editingProduct()"
              (saved)="onSaved()"
              (cancelled)="showForm.set(false)" />
          </div>
        </div>
      </div>
    }

    <ion-header class="ion-no-border">
      <ion-toolbar style="--background:#F7F5F2;--color:#230C00">
        <ion-title>Productos</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="p-4 lg:p-8 max-w-5xl mx-auto">

        <!-- Desktop page header -->
        <div class="hidden lg:flex items-center justify-between mb-6">
          <h1 class="text-2xl font-bold text-[#230C00]">Productos</h1>
          <button (click)="openAdd()"
                  class="bg-[#E8630A] text-[#230C00] font-semibold px-5 py-2.5
                         rounded-xl text-sm hover:opacity-90 transition-opacity">
            + Agregar producto
          </button>
        </div>

        <!-- Search -->
        <input
          [value]="searchQuery()"
          (input)="searchQuery.set($any($event.target).value)"
          placeholder="Buscar producto..."
          class="w-full bg-white border-0 rounded-xl px-4 py-3 text-sm text-[#230C00]
                 shadow-[0_1px_3px_rgba(35,12,0,0.08)] mb-3
                 focus:outline-none focus:ring-2 focus:ring-[#E8630A]/25" />

        <!-- Category chips -->
        <div class="flex gap-2 mb-5" style="overflow-x:auto;scrollbar-width:none;padding-bottom:4px">
          @for (cat of categories; track cat.value) {
            <button (click)="activeCategory.set(cat.value)"
                    class="px-4 py-2 rounded-full text-xs font-semibold shrink-0 transition-colors"
                    [style.background]="activeCategory() === cat.value ? '#E8630A' : '#FFE7B3'"
                    [style.color]="'#230C00'">
              {{ cat.label }}
            </button>
          }
        </div>

        <!-- Product grid: 2 cols mobile, 3 cols desktop -->
        <div class="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          @for (p of filteredProducts(); track p.id) {
            <div class="bg-white rounded-2xl shadow-[0_1px_3px_rgba(35,12,0,0.12)]
                        overflow-hidden relative flex flex-col">
              <!-- Image placeholder -->
              <div class="h-28 lg:h-36 bg-[#FFE7B3]/60 flex items-center justify-center">
                <span class="text-4xl opacity-30">☕</span>
              </div>

              <!-- Archived overlay -->
              @if (!p.isActive) {
                <div style="position:absolute;inset:0;background:rgba(35,12,0,0.55);
                            border-radius:16px;display:flex;align-items:center;
                            justify-content:center">
                  <span class="text-[#FFE7B3] text-xs font-bold tracking-widest uppercase">
                    Archivado
                  </span>
                </div>
              }

              <div class="p-3 flex-1 flex flex-col">
                <h3 class="text-sm font-semibold text-[#230C00] leading-snug">{{ p.name }}</h3>
                <p class="text-base font-bold text-[#230C00] mt-1">
                  &#36;{{ p.totalPrice | number:'1.0-0' }}
                </p>
                <span class="mt-1 self-start text-[10px] font-semibold text-[#230C00]/55
                             bg-[#FFE7B3] px-2 py-0.5 rounded-full capitalize">
                  {{ p.category }}
                </span>

                <!-- Actions -->
                <div class="flex items-center justify-between mt-auto pt-3">
                  <button (click)="openEdit(p)"
                          class="text-xs font-semibold text-[#230C00]/45
                                 hover:text-[#E8630A] transition-colors">
                    Editar
                  </button>
                  <button (click)="toggleActive(p)"
                          class="text-[10px] font-semibold px-2.5 py-1 rounded-full
                                 transition-colors"
                          [style.background]="p.isActive ? 'rgba(0,183,163,0.12)' : 'rgba(35,12,0,0.08)'"
                          [style.color]="p.isActive ? '#00B7A3' : 'rgba(35,12,0,0.4)'">
                    {{ p.isActive ? 'Activo' : 'Inactivo' }}
                  </button>
                </div>
              </div>
            </div>
          } @empty {
            <div class="col-span-2 lg:col-span-3 bg-white rounded-2xl py-14 text-center
                        shadow-[0_1px_3px_rgba(35,12,0,0.08)] text-[#230C00]/35 text-sm">
              No hay productos que coincidan.
            </div>
          }
        </div>

      </div>
    </ion-content>

    <!-- Mobile FAB -->
    <ion-fab slot="fixed" vertical="bottom" horizontal="end" class="lg:hidden"
             style="margin-bottom:calc(64px + env(safe-area-inset-bottom))">
      <ion-fab-button (click)="openAdd()"
                      style="--background:#E8630A;--color:#230C00;
                             --box-shadow:0 4px 12px rgba(35,12,0,0.20)">
        <ion-icon name="add" />
      </ion-fab-button>
    </ion-fab>
  `,
})
export class ProductsComponent {
  private productService = inject(ProductService);

  protected readonly categories      = CATEGORIES;
  protected readonly showForm        = signal(false);
  protected readonly editingProduct  = signal<Product | undefined>(undefined);
  protected readonly searchQuery     = signal('');
  protected readonly activeCategory  = signal('all');

  protected readonly filteredProducts = computed(() => {
    const q   = this.searchQuery().toLowerCase().trim();
    const cat = this.activeCategory();
    return this.productService.products().filter(p =>
      (cat === 'all' || p.category === (cat as ProductCategory)) &&
      (q === '' || p.name.toLowerCase().includes(q)),
    );
  });

  constructor() {
    addIcons({ add });
  }

  openAdd(): void {
    this.editingProduct.set(undefined);
    this.showForm.set(true);
  }

  openEdit(product: Product): void {
    this.editingProduct.set(product);
    this.showForm.set(true);
  }

  onSaved(): void {
    this.showForm.set(false);
  }

  toggleActive(p: Product): void {
    if (p.isActive) {
      this.productService.archiveProduct(p.id);
    } else {
      this.productService.updateProduct(p.id, { isActive: true });
    }
  }
}
