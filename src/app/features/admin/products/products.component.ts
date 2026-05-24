import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  IonBadge,
  IonButton,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { ProductService } from '../../../core/db/product.service';
import { Product } from '../../../core/models/product.model';
import { ProductFormComponent } from './product-form.component';

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
    IonItem,
    IonLabel,
    IonList,
    IonTitle,
    IonToolbar,
    IonButton,
    IonBadge,
    ProductFormComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Productos</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
        @if (showForm()) {
          <app-product-form
            [product]="editingProduct()"
            (saved)="onSaved()"
            (cancelled)="showForm.set(false)"
          />
        } @else {
          <ion-list>
            @for (p of productService.products(); track p.id) {
              <ion-item>
                <ion-label>
                  <h2>{{ p.name }}</h2>
                  <p>{{ p.category }} — $&nbsp;{{ p.totalPrice | number : '1.0-0' }}</p>
                </ion-label>
                <ion-badge slot="end" [color]="p.isActive ? 'success' : 'medium'">
                  {{ p.isActive ? 'Activo' : 'Archivado' }}
                </ion-badge>
                <ion-button fill="clear" slot="end" (click)="openEdit(p)">
                  <ion-icon slot="icon-only" name="pencil-outline" />
                </ion-button>
                @if (p.isActive) {
                  <ion-button fill="clear" color="medium" slot="end" (click)="archive(p.id)">
                    <ion-icon slot="icon-only" name="archive-outline" />
                  </ion-button>
                }
              </ion-item>
            } @empty {
              <ion-item>
                <ion-label>No hay productos. Usa el botón + para agregar.</ion-label>
              </ion-item>
            }
          </ion-list>

          <ion-fab slot="fixed" vertical="bottom" horizontal="end">
            <ion-fab-button (click)="openAdd()">
              <ion-icon name="add" />
            </ion-fab-button>
          </ion-fab>
        }
    </ion-content>
  `,
})
export class ProductsComponent {
  readonly productService = inject(ProductService);

  showForm = signal(false);
  editingProduct = signal<Product | undefined>(undefined);

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

  archive(id: string): void {
    this.productService.archiveProduct(id);
  }
}
