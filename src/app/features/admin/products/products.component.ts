import { Component, computed, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { read, utils, writeFileXLSX } from 'xlsx';
import {
  AlertController,
  IonButton,
  IonButtons,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  add,
  beerOutline,
  cafeOutline,
  cloudUploadOutline,
  createOutline,
  eyeOffOutline,
  eyeOutline,
  flaskOutline,
  gridOutline,
  iceCreamOutline,
  personCircleOutline,
  pricetagOutline,
  restaurantOutline,
  trashOutline,
  wineOutline,
} from 'ionicons/icons';
import { AuthService } from '../../../core/auth/auth.service';
import { ProductService } from '../../../core/db/product.service';
import { Product, ProductAddition, ProductCategory, ProductSubcategory } from '../../../core/models/product.model';
import {
  CATEGORY_SEGMENT_OPTIONS,
  categoryRequiresSubcategory,
  getCategoryNode,
  isValidCategory,
  isValidSubcategory,
} from '../../../core/models/category-tree';
import { buildAdditions, findDuplicate, parseBoolean, parseList, parsePriceList } from './import-parsers';
import { ProductFormComponent } from './product-form.component';

interface ImportRow {
  key: string;
  name: string;
  description: string | null;
  category: ProductCategory;
  subcategory: ProductSubcategory | null;
  variants: string[];
  additions: ProductAddition[];
  basePrice: number;
  isActive: boolean;
  isNew: boolean;
  existingId: string | null;
}

interface ImportError {
  row: number;
  reason: string;
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    DecimalPipe,
    IonButton,
    IonButtons,
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon,
    IonLabel,
    IonSegment,
    IonSegmentButton,
    IonTitle,
    IonToolbar,
    ProductFormComponent,
  ],
  styles: [`
    :host { display: block; height: 100%; }
    @media (min-width: 1024px) { ion-header { display: none; } }
  `],
  template: `
    <!-- Hidden file input for Excel import (desktop only) -->
    <input #fileInput type="file" accept=".xlsx,.xls" style="display:none"
           (change)="onFileSelected($event)">

    <!-- Import errors overlay -->
    @if (importErrors().length > 0) {
      <div style="position:fixed;inset:0;z-index:1002;background:rgba(35,12,0,0.55);
                  display:flex;align-items:center;justify-content:center;padding:24px">
        <div style="background:white;border-radius:20px;width:100%;max-width:600px;
                    max-height:80vh;display:flex;flex-direction:column;overflow:hidden;
                    box-shadow:0 8px 32px rgba(35,12,0,0.25)">
          <div style="padding:20px 24px 16px;border-bottom:1px solid rgba(35,12,0,0.08);
                      display:flex;align-items:center;justify-content:space-between">
            <div>
              <h2 style="font-size:1rem;font-weight:700;color:var(--ion-color-primary);margin:0">
                Errores en el archivo
              </h2>
              <p style="font-size:.8rem;color:var(--ion-color-medium);margin:4px 0 0">
                No se aplicó ningún cambio. Corrige las filas indicadas y vuelve a cargar el archivo.
              </p>
            </div>
            <button (click)="importErrors.set([])"
                    style="color:rgba(var(--ion-color-primary-rgb),.45);background:none;border:none;
                           font-size:1.2rem;cursor:pointer;width:32px;height:32px;
                           border-radius:50%;display:flex;align-items:center;justify-content:center">
              ✕
            </button>
          </div>
          <div style="flex:1;overflow:auto">
            <ul style="margin:0;padding:0;list-style:none">
              @for (err of importErrors(); track err.row) {
                <li style="padding:10px 24px;border-bottom:1px solid var(--ion-color-light);
                           font-size:.85rem;color:var(--ion-color-dark)">
                  <strong>Fila {{ err.row }}:</strong> {{ err.reason }}
                </li>
              }
            </ul>
          </div>
          <div style="padding:16px 24px;border-top:1px solid rgba(35,12,0,0.08);
                      display:flex;justify-content:flex-end">
            <ion-button (click)="importErrors.set([])" color="secondary" class="btn-rounded">
              Cerrar
            </ion-button>
          </div>
        </div>
      </div>
    }

    <!-- Import preview overlay -->
    @if (showImportPreview()) {
      <div style="position:fixed;inset:0;z-index:1001;background:rgba(35,12,0,0.55);
                  display:flex;align-items:center;justify-content:center;padding:24px">
        <div style="background:white;border-radius:20px;width:100%;max-width:800px;
                    max-height:80vh;display:flex;flex-direction:column;overflow:hidden;
                    box-shadow:0 8px 32px rgba(35,12,0,0.25)">
          <!-- Header -->
          <div style="padding:20px 24px 16px;border-bottom:1px solid rgba(35,12,0,0.08);
                      display:flex;align-items:center;justify-content:space-between">
            <div>
              <h2 style="font-size:1rem;font-weight:700;color:var(--ion-color-primary);margin:0">
                Previsualización de carga
              </h2>
              <p style="font-size:.8rem;color:var(--ion-color-medium);margin:4px 0 0">
                {{ newCount() }} nuevos · {{ updateCount() }} a actualizar
              </p>
            </div>
            <button (click)="cancelImport()"
                    style="color:rgba(var(--ion-color-primary-rgb),.45);background:none;border:none;
                           font-size:1.2rem;cursor:pointer;width:32px;height:32px;
                           border-radius:50%;display:flex;align-items:center;justify-content:center">
              ✕
            </button>
          </div>
          <!-- Table -->
          <div style="flex:1;overflow:auto">
            <table style="width:100%;border-collapse:collapse;min-width:560px">
              <thead>
                <tr style="background:var(--ion-color-primary);position:sticky;top:0">
                  <th style="text-align:left;padding:10px 16px;font-size:.7rem;font-weight:700;
                             text-transform:uppercase;letter-spacing:.06em;color:var(--ion-color-primary-contrast)">
                    Nombre
                  </th>
                  <th style="text-align:left;padding:10px 16px;font-size:.7rem;font-weight:700;
                             text-transform:uppercase;letter-spacing:.06em;color:var(--ion-color-primary-contrast)">
                    Categoría
                  </th>
                  <th style="text-align:right;padding:10px 16px;font-size:.7rem;font-weight:700;
                             text-transform:uppercase;letter-spacing:.06em;color:var(--ion-color-primary-contrast)">
                    Base
                  </th>
                  <th style="text-align:center;padding:10px 16px;font-size:.7rem;font-weight:700;
                             text-transform:uppercase;letter-spacing:.06em;color:var(--ion-color-primary-contrast)">
                    Activo
                  </th>
                  <th style="text-align:center;padding:10px 16px;font-size:.7rem;font-weight:700;
                             text-transform:uppercase;letter-spacing:.06em;color:var(--ion-color-primary-contrast)">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                @for (row of importRows(); track row.key) {
                  <tr style="border-bottom:1px solid var(--ion-color-light)">
                    <td style="padding:10px 16px;font-size:.875rem;color:var(--ion-color-dark);font-weight:500">
                      {{ row.name }}
                    </td>
                    <td style="padding:10px 16px;font-size:.875rem;color:var(--ion-color-medium)">
                      {{ row.category }}{{ row.subcategory ? ' / ' + row.subcategory : '' }}
                    </td>
                    <td style="padding:10px 16px;font-size:.875rem;color:var(--ion-color-dark);
                               text-align:right;white-space:nowrap">
                      $ {{ row.basePrice | number:'1.0-0' }}
                    </td>
                    <td style="padding:10px 16px;text-align:center">
                      @if (row.isActive) {
                        <span style="color:var(--ion-color-tertiary);font-size:1rem">✓</span>
                      } @else {
                        <span style="color:rgba(var(--ion-color-primary-rgb),0.3);font-size:1rem">—</span>
                      }
                    </td>
                    <td style="padding:10px 16px;text-align:center">
                      @if (row.isNew) {
                        <span style="padding:3px 10px;border-radius:9999px;font-size:.72rem;
                                     font-weight:700;background:rgba(0,183,163,0.12);
                                     color:var(--ion-color-tertiary);white-space:nowrap">
                          Nuevo
                        </span>
                      } @else {
                        <span style="padding:3px 10px;border-radius:9999px;font-size:.72rem;
                                     font-weight:700;background:rgba(232,99,10,0.12);
                                     color:var(--ion-color-secondary);white-space:nowrap">
                          Actualizar
                        </span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <!-- Footer -->
          <div style="padding:16px 24px;border-top:1px solid rgba(35,12,0,0.08);
                      display:flex;align-items:center;justify-content:flex-end;gap:12px">
            <ion-button fill="outline" (click)="cancelImport()" class="btn-rounded"
                        style="--color:var(--ion-color-primary);--border-color:rgba(var(--ion-color-primary-rgb),0.25)">
              Cancelar
            </ion-button>
            <ion-button (click)="applyImport()" [disabled]="importing()"
                        color="secondary" class="btn-rounded">
              {{ importing() ? 'Aplicando...' : 'Aceptar (' + importRows().length + ')' }}
            </ion-button>
          </div>
        </div>
      </div>
    }

    <!-- Form overlay -->
    @if (showForm()) {
      <div style="position:fixed;inset:0;z-index:1000;background:rgba(35,12,0,0.45);
                  display:flex;align-items:flex-end;justify-content:center;padding:16px"
           class="lg:items-center">
        <div class="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
          <div class="flex items-center justify-between px-5 py-4
                      border-b border-espresso/8">
            <h2 class="font-semibold text-espresso">
              {{ editingProduct() ? 'Editar producto' : 'Nuevo producto' }}
            </h2>
            <button (click)="showForm.set(false)"
                    class="text-espresso/70 hover:text-espresso text-xl leading-none
                           w-8 h-8 flex items-center justify-center rounded-full
                           hover:bg-espresso/8 transition-colors">
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
      <ion-toolbar>
        <img slot="start" src="/logo_blanco_sin_fondo.svg" alt="Le Tiende" width="55" height="24"
             style="height:24px;margin-left:16px">
        <ion-title class="text-center">Productos</ion-title>
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
      <div class="p-4 lg:p-8 max-w-5xl mx-auto">

        <!-- Desktop page header -->
        <div class="hidden lg:flex items-center justify-between mb-6">
          <h1 class="text-2xl font-bold text-espresso">Productos</h1>
          <div style="display:flex;align-items:center;gap:12px">
            <button (click)="downloadTemplate()"
                    style="font-size:.8rem;color:var(--ion-color-secondary);cursor:pointer;background:none;
                           border:none;text-decoration:underline;text-underline-offset:3px;
                           padding:0;font-family:inherit">
              Descargar plantilla
            </button>
            <ion-button (click)="triggerFileSelect()" fill="outline" class="btn-rounded"
                        style="--color:var(--ion-color-primary);--border-color:rgba(var(--ion-color-primary-rgb),0.25)">
              <ion-icon slot="start" name="cloud-upload-outline" />
              &nbsp;
              Cargar Excel
            </ion-button>
            <ion-button (click)="openAdd()" color="secondary" class="btn-rounded">
              + Agregar producto
            </ion-button>
          </div>
        </div>

        <!-- Search -->
        <input
          [value]="searchQuery()"
          (input)="searchQuery.set($any($event.target).value)"
          placeholder="Buscar producto..."
          class="w-full bg-white border-0 rounded-xl px-4 py-3 text-sm text-espresso
                 shadow-[0_1px_3px_rgba(35,12,0,0.08)] mb-3
                 focus:outline-none focus:ring-2 focus:ring-orange/25" />

        <!-- Category segment -->
        <ion-segment class="mt-[1em]" [value]="activeCategory()" (ionChange)="onCategoryChange($event)"
                     style="--background:white;
                            box-shadow:0 1px 3px rgba(35,12,0,0.08);
                            border-radius:16px;
                            padding:4px;
                            margin-bottom:20px">
          @for (cat of categories; track cat.value) {
            <ion-segment-button class="min-w-[4em]" [value]="cat.value"
                                style="--color:rgba(35,12,0,0.5);
                                       --color-checked:var(--ion-color-primary-contrast);
                                       --background-checked:var(--ion-color-primary);
                                       --indicator-color:transparent;
                                       --indicator-height:0;
                                       --border-radius:12px;
                                       --min-width:0">
              <ion-icon [name]="cat.icon" class="lg:hidden" style="font-size:1.3rem;margin:0" />
              <ion-label class="hidden lg:block">{{ cat.label }}</ion-label>
            </ion-segment-button>
          }
        </ion-segment>

        <!-- Active category label — mobile only -->
        <p class="lg:hidden text-sm font-semibold text-espresso mb-3 px-1">
          {{ activeCategoryLabel() }}
        </p>

        <!-- Mobile: lista de productos -->
        <div class="lg:hidden flex flex-col gap-2 pb-32">
          @for (p of filteredProducts(); track p.id) {
            <div class="flex items-center gap-3 bg-white rounded-xl px-3 py-2.5
                        shadow-[0_1px_3px_rgba(35,12,0,0.08)]"
                 [class.opacity-50]="!p.isActive">
              <div class="w-9 h-9 rounded-full bg-cream/60 flex items-center justify-center shrink-0">
                <ion-icon [name]="categoryIcon(p.category)"
                          style="font-size:1.2rem;color:rgba(var(--ion-color-primary-rgb),0.35)" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-espresso truncate leading-tight">{{ p.name }}</p>
                <p class="text-sm font-bold text-espresso">&#36;{{ p.basePrice | number:'1.0-0' }}</p>
              </div>
              @if (!p.isActive) {
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full
                             bg-espresso/8 text-espresso/68 uppercase shrink-0">
                  Archivado
                </span>
              }
              <div class="flex items-center shrink-0">
                <ion-button fill="clear" size="small" (click)="openEdit(p)">
                  <ion-icon slot="icon-only" name="create-outline"
                            style="color:var(--ion-color-primary)" />
                </ion-button>
                <ion-button fill="clear" size="small" (click)="toggleActive(p)">
                  <ion-icon slot="icon-only"
                            [name]="p.isActive ? 'eye-outline' : 'eye-off-outline'"
                            [style.color]="p.isActive ? 'var(--ion-color-tertiary)' : 'rgba(var(--ion-color-primary-rgb),0.3)'" />
                </ion-button>
              </div>
            </div>
          } @empty {
            <div class="bg-white rounded-xl py-14 text-center
                        shadow-[0_1px_3px_rgba(35,12,0,0.08)] text-espresso/64 text-sm">
              No hay productos que coincidan.
            </div>
          }
        </div>

        <!-- Desktop: grid de cards -->
        <div class="hidden lg:grid lg:grid-cols-3 gap-4">
          @for (p of filteredProducts(); track p.id) {
            <div class="bg-white rounded-2xl shadow-[0_1px_3px_rgba(35,12,0,0.12)]
                        overflow-hidden relative flex flex-col">
              <div class="h-36 bg-cream/60 flex items-center justify-center">
                <ion-icon [name]="categoryIcon(p.category)"
                          style="font-size:3rem;color:rgba(var(--ion-color-primary-rgb),0.22)" />
              </div>
              @if (!p.isActive) {
                <div (click)="toggleActive(p)"
                     style="position:absolute;inset:0;background:rgba(35,12,0,0.55);
                            border-radius:16px;display:flex;flex-direction:column;
                            align-items:center;justify-content:center;
                            cursor:pointer;gap:4px">
                  <span style="color:var(--ion-color-primary-contrast);font-size:.7rem;font-weight:700;
                               letter-spacing:.1em;text-transform:uppercase">
                    Archivado
                  </span>
                  <span style="color:rgba(var(--ion-color-primary-contrast-rgb),.55);font-size:.65rem">
                    Clic para activar
                  </span>
                </div>
              }
              <div class="p-3 flex-1 flex flex-col">
                <h3 class="text-sm font-semibold text-espresso leading-snug">{{ p.name }}</h3>
                <p class="text-base font-bold text-espresso mt-1">
                  &#36;{{ p.basePrice | number:'1.0-0' }}
                </p>
                <div class="flex gap-2 mt-auto pt-3">
                  <ion-button (click)="openEdit(p)" fill="outline" size="small" expand="block"
                              class="flex-1"
                              style="--color:var(--ion-color-primary);--border-color:rgba(var(--ion-color-primary-rgb),0.2);
                                     --border-radius:10px;--border-width:1px;
                                     --border-style:solid;margin:0">
                    Editar
                  </ion-button>
                  <ion-button (click)="toggleActive(p)" fill="solid" size="small" expand="block"
                              class="flex-1"
                              [style.--background]="p.isActive ? 'rgba(0,183,163,0.12)' : 'rgba(35,12,0,0.08)'"
                              [style.--color]="p.isActive ? 'var(--ion-color-tertiary)' : 'rgba(var(--ion-color-primary-rgb),0.4)'"
                              style="--border-radius:10px;--box-shadow:none;margin:0">
                    {{ p.isActive ? 'Activo' : 'Inactivo' }}
                  </ion-button>
                </div>
              </div>
            </div>
          } @empty {
            <div class="col-span-3 bg-white rounded-2xl py-14 text-center
                        shadow-[0_1px_3px_rgba(35,12,0,0.08)] text-espresso/64 text-sm">
              No hay productos que coincidan.
            </div>
          }
        </div>

        <!-- Zona peligrosa: borrado masivo de productos -->
        <div class="mt-10 pb-24 lg:pb-0" style="border:1px dashed rgba(var(--ion-color-danger-rgb),0.35);
                    border-radius:16px;padding:16px 20px;background:rgba(var(--ion-color-danger-rgb),0.04)">
          <h2 style="font-size:.8rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
                     color:var(--ion-color-danger);margin:0 0 4px">
            Zona peligrosa
          </h2>
          <p style="font-size:.8rem;color:var(--ion-color-medium);margin:0 0 12px">
            Borra todo el catálogo para empezar desde cero. Esta acción no se puede deshacer.
          </p>
          <ion-button (click)="confirmDeleteAll()" [disabled]="deletingAll()"
                      color="danger" fill="outline" class="btn-rounded">
            <ion-icon slot="start" name="trash-outline" />
            &nbsp;
            {{ deletingAll() ? 'Borrando...' : 'Borrar todos los productos' }}
          </ion-button>
        </div>

      </div>
    </ion-content>

    <!-- Mobile FAB -->
    <ion-fab slot="fixed" vertical="bottom" horizontal="end" class="lg:hidden"
             style="margin-bottom:env(safe-area-inset-bottom)">
      <ion-fab-button (click)="openAdd()" color="secondary"
                      style="--box-shadow:0 4px 12px rgba(35,12,0,0.20)">
        <ion-icon name="add" />
      </ion-fab-button>
    </ion-fab>
  `,
})
export class ProductsComponent {
  @ViewChild('fileInput') private fileInputRef!: ElementRef<HTMLInputElement>;

  private auth = inject(AuthService);
  private productService = inject(ProductService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  protected readonly categories = CATEGORY_SEGMENT_OPTIONS;
  protected readonly photoURL = computed(() => this.auth.currentUser()?.photoURL ?? null);
  protected readonly showForm = signal(false);
  protected readonly editingProduct = signal<Product | undefined>(undefined);
  protected readonly searchQuery = signal('');
  protected readonly activeCategory = signal('all');

  protected readonly showImportPreview = signal(false);
  protected readonly importRows = signal<ImportRow[]>([]);
  protected readonly importErrors = signal<ImportError[]>([]);
  protected readonly importing = signal(false);
  protected readonly deletingAll = signal(false);

  protected readonly newCount = computed(() => this.importRows().filter((r) => r.isNew).length);
  protected readonly updateCount = computed(() => this.importRows().filter((r) => !r.isNew).length);

  protected readonly activeCategoryLabel = computed(() =>
    this.categories.find((c) => c.value === this.activeCategory())?.label ?? '',
  );

  protected readonly filteredProducts = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const cat = this.activeCategory();
    return this.productService.products().filter(
      (p) =>
        (cat === 'all' || p.category === (cat as ProductCategory)) &&
        (q === '' || p.name.toLowerCase().includes(q)),
    );
  });

  constructor() {
    addIcons({
      add,
      beerOutline,
      cafeOutline,
      cloudUploadOutline,
      createOutline,
      eyeOffOutline,
      eyeOutline,
      flaskOutline,
      gridOutline,
      iceCreamOutline,
      wineOutline,
      restaurantOutline,
      pricetagOutline,
      personCircleOutline,
      trashOutline,
    });
  }

  protected categoryIcon(cat: string): string {
    return getCategoryNode(cat)?.icon ?? 'pricetag-outline';
  }

  onCategoryChange(ev: Event): void {
    this.activeCategory.set((ev as CustomEvent).detail.value as string);
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

  async toggleActive(p: Product): Promise<void> {
    try {
      if (p.isActive) {
        await this.productService.archiveProduct(p.id);
      } else {
        await this.productService.updateProduct(p.id, { isActive: true });
      }
    } catch {
      this.toastCtrl
        .create({
          message: 'No se pudo actualizar el producto. Intenta nuevamente.',
          duration: 5000,
          position: 'top',
          color: 'danger',
        })
        .then((t) => t.present());
    }
  }

  triggerFileSelect(): void {
    this.fileInputRef.nativeElement.click();
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const ab = await file.arrayBuffer();
    const wb = read(ab);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const raw = utils.sheet_to_json<Record<string, unknown>>(ws);

    const normalizedCurrent = new Map<string, Product>();
    for (const p of this.productService.products()) {
      normalizedCurrent.set(this.dedupeKey(p.name, p.category, p.subcategory ?? null), p);
    }

    const rows: ImportRow[] = [];
    const errors: ImportError[] = [];
    let rowNumber = 1; // fila 1 = encabezado; los datos empiezan en la fila 2
    for (const r of raw) {
      rowNumber++;
      const name = String(r['name'] ?? '').trim();
      if (!name) continue;

      const rawCategory = String(r['category'] ?? '').toLowerCase().trim();
      if (!isValidCategory(rawCategory)) {
        errors.push({ row: rowNumber, reason: `Categoría inválida: "${r['category'] ?? ''}"` });
        continue;
      }
      const category = rawCategory;

      const rawSubcategory = String(r['subcategory'] ?? '').toLowerCase().trim();
      let subcategory: ProductSubcategory | null = null;
      if (categoryRequiresSubcategory(category)) {
        if (!rawSubcategory) {
          errors.push({ row: rowNumber, reason: `La categoría "${category}" requiere una subcategoría` });
          continue;
        }
        if (!isValidSubcategory(category, rawSubcategory)) {
          errors.push({
            row: rowNumber,
            reason: `Subcategoría inválida "${r['subcategory']}" para la categoría "${category}"`,
          });
          continue;
        }
        subcategory = rawSubcategory as ProductSubcategory;
      } else if (rawSubcategory) {
        errors.push({ row: rowNumber, reason: `La categoría "${category}" no admite subcategoría` });
        continue;
      }

      const basePrice = Number(r['basePrice'] ?? 0);
      if (!isFinite(basePrice) || basePrice < 0) {
        errors.push({ row: rowNumber, reason: 'Precio base inválido' });
        continue;
      }

      const description = String(r['description'] ?? '').trim() || null;

      const variants = parseList(r['variants']);
      const duplicateVariant = findDuplicate(variants);
      if (duplicateVariant !== null) {
        errors.push({ row: rowNumber, reason: `Variante duplicada: "${duplicateVariant}"` });
        continue;
      }

      const additionNames = parseList(r['additions']);
      const additionPrices = parsePriceList(r['additionPrices']);
      const { additions, error: additionsError } = buildAdditions(additionNames, additionPrices);
      if (additionsError !== null) {
        errors.push({ row: rowNumber, reason: additionsError });
        continue;
      }

      const isActive = parseBoolean(r['active']);
      if (isActive === null) {
        errors.push({ row: rowNumber, reason: `Valor de "active" no reconocido: "${r['active'] ?? ''}"` });
        continue;
      }

      const key = this.dedupeKey(name, category, subcategory);
      const existing = normalizedCurrent.get(key);
      rows.push({
        key,
        name,
        description,
        category,
        subcategory,
        variants,
        additions,
        basePrice,
        isActive,
        isNew: !existing,
        existingId: existing?.id ?? null,
      });
    }

    if (errors.length > 0) {
      this.importErrors.set(errors);
      return;
    }

    if (rows.length === 0) return;
    this.importRows.set(rows);
    this.showImportPreview.set(true);
  }

  downloadTemplate(): void {
    // Una fila por cada combinación válida de categoría/subcategoría (15 en
    // total), más al menos un ejemplo de `variants`, uno de `additions` con
    // `additionPrices`, y uno de `description` — para que quien reestructure
    // la hoja `datos` de Google Sheets vea el formato completo de una vez.
    const templateData = [
      // bebidas
      {
        name: 'Café Americano', additions: 'leche_vegetal, licor', variants: '', description: '',
        category: 'bebidas', subcategory: 'de_cafe', basePrice: 5000, additionPrices: '1500, 4000', active: true,
      },
      {
        name: 'Chocolate Caliente', additions: '', variants: '', description: '',
        category: 'bebidas', subcategory: 'calientes', basePrice: 6000, additionPrices: '', active: true,
      },
      {
        name: 'Limonada Natural', additions: '', variants: 'sin_hielo, con_hielo', description: '',
        category: 'bebidas', subcategory: 'frias', basePrice: 6000, additionPrices: '', active: true,
      },
      // cocteles
      {
        name: 'Mojito', additions: '', variants: '', description: 'Ron blanco, hierbabuena, limón y soda.',
        category: 'cocteles', subcategory: 'clasicos', basePrice: 18000, additionPrices: '', active: true,
      },
      {
        name: 'Sunset Le Tiende', additions: '', variants: '', description: 'Con vodka y lo mejor de nuestro café.',
        category: 'cocteles', subcategory: 'de_autor', basePrice: 22000, additionPrices: '', active: true,
      },
      {
        name: 'Old Fashioned', additions: '', variants: '', description: 'Whisky, azúcar y bitters, el clásico de los clásicos.',
        category: 'cocteles', subcategory: 'premium', basePrice: 28000, additionPrices: '', active: true,
      },
      // licores
      {
        name: 'Aguardiente (trago)', additions: '', variants: '', description: '',
        category: 'licores', subcategory: 'trago', basePrice: 6000, additionPrices: '', active: true,
      },
      {
        name: 'Aguardiente (botella)', additions: '', variants: 'azul, rojo', description: '',
        category: 'licores', subcategory: 'botella', basePrice: 60000, additionPrices: '', active: true,
      },
      // cervezas
      {
        name: 'Cerveza Club Colombia', additions: '', variants: 'dorada, roja, negra', description: '',
        category: 'cervezas', subcategory: 'nacionales', basePrice: 8000, additionPrices: '', active: true,
      },
      {
        name: 'Cerveza Heineken', additions: '', variants: '', description: '',
        category: 'cervezas', subcategory: 'importadas', basePrice: 10000, additionPrices: '', active: true,
      },
      {
        name: 'Cerveza BBC Golden', additions: '', variants: 'sweet_stout, amber_ale, indian_pale_ale, american_pale_ale', description: '',
        category: 'cervezas', subcategory: 'artesanales', basePrice: 12000, additionPrices: '', active: true,
      },
      // comida (sin subcategoría)
      {
        name: 'Hamburguesa', additions: '', variants: '', description: 'Con queso cheddar, tocineta y salsa de la casa.',
        category: 'comida', subcategory: '', basePrice: 22000, additionPrices: '', active: true,
      },
      // reposteria (sin subcategoría)
      {
        name: 'Brownie', additions: '', variants: '', description: '',
        category: 'reposteria', subcategory: '', basePrice: 9000, additionPrices: '', active: false,
      },
      // ofertas
      {
        name: 'Combo pareja', additions: '', variants: '', description: '',
        category: 'ofertas', subcategory: 'combos', basePrice: 45000, additionPrices: '', active: true,
      },
      {
        name: '2x1 Cervezas', additions: '', variants: '', description: '',
        category: 'ofertas', subcategory: 'promociones', basePrice: 14000, additionPrices: '', active: false,
      },
    ];
    const ws = utils.json_to_sheet(templateData);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Productos');
    writeFileXLSX(wb, 'plantilla-productos.xlsx');
  }

  async applyImport(): Promise<void> {
    if (this.importing()) return;
    this.importing.set(true);
    try {
      await this.productService.importProducts(
        this.importRows().map((row) => ({
          isNew: row.isNew,
          existingId: row.existingId,
          data: {
            name: row.name,
            description: row.description,
            category: row.category,
            subcategory: row.subcategory,
            variants: row.variants,
            additions: row.additions,
            basePrice: row.basePrice,
            // A diferencia de antes de la Tarea 29, `isActive` se escribe
            // también en las filas existentes: la hoja de Google Sheets es
            // ahora la fuente de verdad del catálogo, así que un producto
            // marcado `active: FALSE` en la hoja debe archivarse en el
            // siguiente import, no solo al crearlo.
            isActive: row.isActive,
          },
        })),
      );
      this.cancelImport();
    } catch {
      // No se cierra el modal para que el usuario pueda reintentar sin
      // perder la previsualización de la carga.
      this.toastCtrl
        .create({
          message: 'No se pudo aplicar la carga. Verifica los datos e intenta nuevamente.',
          duration: 5000,
          position: 'top',
          color: 'danger',
        })
        .then((t) => t.present());
    } finally {
      this.importing.set(false);
    }
  }

  cancelImport(): void {
    this.showImportPreview.set(false);
    this.importRows.set([]);
  }

  async confirmDeleteAll(): Promise<void> {
    const count = this.productService.products().length;
    if (count === 0) {
      this.toastCtrl
        .create({ message: 'No hay productos para borrar.', duration: 3000, position: 'top', color: 'medium' })
        .then((t) => t.present());
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Borrar todos los productos',
      message: `Se eliminarán los ${count} productos del catálogo. Esta acción no se puede deshacer.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Borrar todo',
          role: 'destructive',
          handler: () => this.deleteAllProducts(),
        },
      ],
    });
    await alert.present();
  }

  private async deleteAllProducts(): Promise<void> {
    this.deletingAll.set(true);
    try {
      const deletedCount = await this.productService.deleteAllProducts();
      this.toastCtrl
        .create({
          message: `Se eliminaron ${deletedCount} productos.`,
          duration: 4000,
          position: 'top',
          color: 'success',
        })
        .then((t) => t.present());
    } catch {
      this.toastCtrl
        .create({
          message: 'Ocurrió un error al borrar los productos. Intenta nuevamente.',
          duration: 5000,
          position: 'top',
          color: 'danger',
        })
        .then((t) => t.present());
    } finally {
      this.deletingAll.set(false);
    }
  }

  private normalizeStr(s: string): string {
    return s
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Clave de deduplicación para el import de Excel: el nombre solo no basta
   * porque, con la jerarquía de categorías, dos productos pueden compartir
   * nombre en categorías/subcategorías distintas (ej. "Aguardiente" en
   * licores/trago vs. licores/botella) y no deben colisionar.
   */
  private dedupeKey(
    name: string,
    category: ProductCategory,
    subcategory: ProductSubcategory | null,
  ): string {
    return `${this.normalizeStr(name)}|${category}|${subcategory ?? ''}`;
  }
}
