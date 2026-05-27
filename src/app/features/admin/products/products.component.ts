import { Component, computed, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { read, utils, writeFileXLSX } from 'xlsx';
import {
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
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  add,
  cafeOutline,
  cloudUploadOutline,
  gridOutline,
  personCircleOutline,
  pricetagOutline,
  restaurantOutline,
  wineOutline,
} from 'ionicons/icons';
import { AuthService } from '../../../core/auth/auth.service';
import { ProductService } from '../../../core/db/product.service';
import { Product, ProductCategory } from '../../../core/models/product.model';
import { ProductFormComponent } from './product-form.component';

interface ImportRow {
  name: string;
  category: ProductCategory;
  basePrice: number;
  tipAmount: number;
  totalPrice: number;
  isNew: boolean;
  existingId: string | null;
}

const VALID_CATEGORIES = new Set<string>(['bebidas', 'licores', 'comida', 'otros']);

const CATEGORIES: { value: string; label: string; icon: string }[] = [
  { value: 'all', label: 'Todos', icon: 'grid-outline' },
  { value: 'bebidas', label: 'Bebidas', icon: 'cafe-outline' },
  { value: 'licores', label: 'Licores', icon: 'wine-outline' },
  { value: 'comida', label: 'Comida', icon: 'restaurant-outline' },
  { value: 'otros', label: 'Otros', icon: 'pricetag-outline' },
];

const CATEGORY_ICONS: Record<string, string> = {
  bebidas: 'cafe-outline',
  licores: 'wine-outline',
  comida: 'restaurant-outline',
};

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
              <h2 style="font-size:1rem;font-weight:700;color:#230C00;margin:0">
                Previsualización de carga
              </h2>
              <p style="font-size:.8rem;color:#82746c;margin:4px 0 0">
                {{ newCount() }} nuevos · {{ updateCount() }} a actualizar
              </p>
            </div>
            <button (click)="cancelImport()"
                    style="color:rgba(35,12,0,.45);background:none;border:none;
                           font-size:1.2rem;cursor:pointer;width:32px;height:32px;
                           border-radius:50%;display:flex;align-items:center;justify-content:center">
              ✕
            </button>
          </div>
          <!-- Table -->
          <div style="flex:1;overflow:auto">
            <table style="width:100%;border-collapse:collapse;min-width:560px">
              <thead>
                <tr style="background:#230C00;position:sticky;top:0">
                  <th style="text-align:left;padding:10px 16px;font-size:.7rem;font-weight:700;
                             text-transform:uppercase;letter-spacing:.06em;color:#FFE7B3">
                    Nombre
                  </th>
                  <th style="text-align:left;padding:10px 16px;font-size:.7rem;font-weight:700;
                             text-transform:uppercase;letter-spacing:.06em;color:#FFE7B3">
                    Categoría
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
                  <th style="text-align:center;padding:10px 16px;font-size:.7rem;font-weight:700;
                             text-transform:uppercase;letter-spacing:.06em;color:#FFE7B3">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                @for (row of importRows(); track row.name) {
                  <tr style="border-bottom:1px solid #FFE7B3">
                    <td style="padding:10px 16px;font-size:.875rem;color:#251a00;font-weight:500">
                      {{ row.name }}
                    </td>
                    <td style="padding:10px 16px;font-size:.875rem;color:#82746c">
                      {{ row.category }}
                    </td>
                    <td style="padding:10px 16px;font-size:.875rem;color:#251a00;
                               text-align:right;white-space:nowrap">
                      $ {{ row.basePrice | number:'1.0-0' }}
                    </td>
                    <td style="padding:10px 16px;font-size:.875rem;color:#251a00;
                               text-align:right;white-space:nowrap">
                      $ {{ row.tipAmount | number:'1.0-0' }}
                    </td>
                    <td style="padding:10px 16px;font-size:.875rem;font-weight:700;color:#251a00;
                               text-align:right;white-space:nowrap">
                      $ {{ row.totalPrice | number:'1.0-0' }}
                    </td>
                    <td style="padding:10px 16px;text-align:center">
                      @if (row.isNew) {
                        <span style="padding:3px 10px;border-radius:9999px;font-size:.72rem;
                                     font-weight:700;background:rgba(0,183,163,0.12);
                                     color:#00B7A3;white-space:nowrap">
                          Nuevo
                        </span>
                      } @else {
                        <span style="padding:3px 10px;border-radius:9999px;font-size:.72rem;
                                     font-weight:700;background:rgba(232,99,10,0.12);
                                     color:#E8630A;white-space:nowrap">
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
            <ion-button fill="outline" (click)="cancelImport()"
                        style="--color:#230C00;--border-color:rgba(35,12,0,0.25);--border-radius:12px">
              Cancelar
            </ion-button>
            <ion-button (click)="applyImport()" [disabled]="importing()"
                        style="--background:#E8630A;--color:#230C00;--border-radius:12px">
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
      <ion-toolbar style="--background:#230C00;--color:#FFE7B3">
        <img slot="start" src="/logo_blanco_sin_fondo.svg" alt="Le Tiende"
             style="height:24px;margin-left:16px">
        <ion-title class="text-center">Productos</ion-title>
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
      <div class="p-4 lg:p-8 max-w-5xl mx-auto">

        <!-- Desktop page header -->
        <div class="hidden lg:flex items-center justify-between mb-6">
          <h1 class="text-2xl font-bold text-[#230C00]">Productos</h1>
          <div style="display:flex;align-items:center;gap:12px">
            <button (click)="downloadTemplate()"
                    style="font-size:.8rem;color:#E8630A;cursor:pointer;background:none;
                           border:none;text-decoration:underline;text-underline-offset:3px;
                           padding:0;font-family:inherit">
              Descargar plantilla
            </button>
            <ion-button (click)="triggerFileSelect()" fill="outline"
                        style="--color:#230C00;--border-color:rgba(35,12,0,0.25);--border-radius:12px">
              <ion-icon slot="start" name="cloud-upload-outline" />
              &nbsp;
              Cargar Excel
            </ion-button>
            <ion-button (click)="openAdd()"
                        style="--background:#E8630A;--color:#230C00;--border-radius:12px">
              + Agregar producto
            </ion-button>
          </div>
        </div>

        <!-- Search -->
        <input
          [value]="searchQuery()"
          (input)="searchQuery.set($any($event.target).value)"
          placeholder="Buscar producto..."
          class="w-full bg-white border-0 rounded-xl px-4 py-3 text-sm text-[#230C00]
                 shadow-[0_1px_3px_rgba(35,12,0,0.08)] mb-3
                 focus:outline-none focus:ring-2 focus:ring-[#E8630A]/25" />

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
                                       --color-checked:#FFE7B3;
                                       --background-checked:#230C00;
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
        <p class="lg:hidden text-sm font-semibold text-[#230C00] mb-3 px-1">
          {{ activeCategoryLabel() }}
        </p>

        <!-- Product grid: 2 cols mobile, 3 cols desktop -->
        <div class="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          @for (p of filteredProducts(); track p.id) {
            <div class="bg-white rounded-2xl shadow-[0_1px_3px_rgba(35,12,0,0.12)]
                        overflow-hidden relative flex flex-col">
              <!-- Category icon -->
              <div class="h-28 lg:h-36 bg-[#FFE7B3]/60 flex items-center justify-center">
                <ion-icon [name]="categoryIcon(p.category)"
                          style="font-size:3rem;color:rgba(35,12,0,0.22)" />
              </div>

              <!-- Archived overlay -->
              @if (!p.isActive) {
                <div (click)="toggleActive(p)"
                     style="position:absolute;inset:0;background:rgba(35,12,0,0.55);
                            border-radius:16px;display:flex;flex-direction:column;
                            align-items:center;justify-content:center;
                            cursor:pointer;gap:4px">
                  <span style="color:#FFE7B3;font-size:.7rem;font-weight:700;
                               letter-spacing:.1em;text-transform:uppercase">
                    Archivado
                  </span>
                  <span style="color:rgba(255,231,179,.55);font-size:.65rem">
                    Toca para activar
                  </span>
                </div>
              }

              <div class="p-3 flex-1 flex flex-col">
                <h3 class="text-sm font-semibold text-[#230C00] leading-snug">{{ p.name }}</h3>
                <p class="text-base font-bold text-[#230C00] mt-1">
                  &#36;{{ p.totalPrice | number:'1.0-0' }}
                </p>

                <!-- Actions -->
                <div class="flex gap-2 mt-auto pt-3">
                  <ion-button (click)="openEdit(p)" fill="outline" size="small" expand="block"
                              class="flex-1"
                              style="--color:#230C00;--border-color:rgba(35,12,0,0.2);
                                     --border-radius:10px;--border-width:1px;
                                     --border-style:solid;margin:0">
                    Editar
                  </ion-button>
                  <ion-button (click)="toggleActive(p)" fill="solid" size="small" expand="block"
                              class="flex-1"
                              [style.--background]="p.isActive ? 'rgba(0,183,163,0.12)' : 'rgba(35,12,0,0.08)'"
                              [style.--color]="p.isActive ? '#00B7A3' : 'rgba(35,12,0,0.4)'"
                              style="--border-radius:10px;--box-shadow:none;margin:0">
                    {{ p.isActive ? 'Activo' : 'Inactivo' }}
                  </ion-button>
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
  @ViewChild('fileInput') private fileInputRef!: ElementRef<HTMLInputElement>;

  private auth = inject(AuthService);
  private productService = inject(ProductService);

  protected readonly categories = CATEGORIES;
  protected readonly photoURL = computed(() => this.auth.currentUser()?.photoURL ?? null);
  protected readonly showForm = signal(false);
  protected readonly editingProduct = signal<Product | undefined>(undefined);
  protected readonly searchQuery = signal('');
  protected readonly activeCategory = signal('all');

  protected readonly showImportPreview = signal(false);
  protected readonly importRows = signal<ImportRow[]>([]);
  protected readonly importing = signal(false);

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
      cafeOutline,
      cloudUploadOutline,
      gridOutline,
      wineOutline,
      restaurantOutline,
      pricetagOutline,
      personCircleOutline,
    });
  }

  protected categoryIcon(cat: string): string {
    return CATEGORY_ICONS[cat] ?? 'pricetag-outline';
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

  toggleActive(p: Product): void {
    if (p.isActive) {
      this.productService.archiveProduct(p.id);
    } else {
      this.productService.updateProduct(p.id, { isActive: true });
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
      normalizedCurrent.set(this.normalizeStr(p.name), p);
    }

    const rows: ImportRow[] = [];
    for (const r of raw) {
      const name = String(r['name'] ?? '').trim();
      if (!name) continue;

      const rawCat = String(r['category'] ?? '').toLowerCase().trim();
      const category = VALID_CATEGORIES.has(rawCat) ? (rawCat as ProductCategory) : 'otros';
      const basePrice = Number(r['basePrice'] ?? 0);
      const tipAmount = Number(r['tipAmount'] ?? 0);
      if (!isFinite(basePrice) || !isFinite(tipAmount)) continue;

      const existing = normalizedCurrent.get(this.normalizeStr(name));
      rows.push({
        name,
        category,
        basePrice,
        tipAmount,
        totalPrice: basePrice + tipAmount,
        isNew: !existing,
        existingId: existing?.id ?? null,
      });
    }

    if (rows.length === 0) return;
    this.importRows.set(rows);
    this.showImportPreview.set(true);
  }

  downloadTemplate(): void {
    const templateData = [
      { name: 'Café Americano', category: 'bebidas', basePrice: 5000, tipAmount: 500 },
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
      await Promise.all(
        this.importRows().map((row) =>
          row.isNew
            ? this.productService.addProduct({
              name: row.name,
              category: row.category,
              basePrice: row.basePrice,
              tipAmount: row.tipAmount,
              totalPrice: row.totalPrice,
              isActive: true,
            })
            : this.productService.updateProduct(row.existingId!, {
              name: row.name,
              category: row.category,
              basePrice: row.basePrice,
              tipAmount: row.tipAmount,
              totalPrice: row.totalPrice,
            }),
        ),
      );
      this.cancelImport();
    } finally {
      this.importing.set(false);
    }
  }

  cancelImport(): void {
    this.showImportPreview.set(false);
    this.importRows.set([]);
  }

  private normalizeStr(s: string): string {
    return s
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }
}
