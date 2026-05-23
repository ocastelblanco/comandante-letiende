import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import {
  addDoc,
  collection,
  doc,
  Firestore,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from '@angular/fire/firestore';
import { Product } from '../models/product.model';

type ProductInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;

@Injectable({ providedIn: 'root' })
export class ProductService {
  private firestore = inject(Firestore);
  private colRef = collection(this.firestore, 'products');

  private readonly _products = signal<Product[]>([]);
  readonly products = this._products.asReadonly();
  readonly activeProducts = computed(() => this._products().filter((p) => p.isActive));

  constructor() {
    const unsubscribe = onSnapshot(this.colRef, (snap) => {
      this._products.set(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product),
      );
    });
    inject(DestroyRef).onDestroy(unsubscribe);
  }

  addProduct(data: ProductInput): Promise<unknown> {
    return addDoc(this.colRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  updateProduct(id: string, data: Partial<ProductInput>): Promise<void> {
    return updateDoc(doc(this.firestore, 'products', id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }

  archiveProduct(id: string): Promise<void> {
    return updateDoc(doc(this.firestore, 'products', id), {
      isActive: false,
      updatedAt: serverTimestamp(),
    });
  }
}
