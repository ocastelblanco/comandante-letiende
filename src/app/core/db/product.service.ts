import { computed, inject, Injectable, signal } from '@angular/core';
import {
  addDoc,
  collection,
  doc,
  Firestore,
  getDocs,
  onSnapshot,
  QuerySnapshot,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from '@angular/fire/firestore';
import { Product } from '../models/product.model';
import { connectWhileAuthenticated } from './live-listener';

/** Límite máximo de operaciones por lote impuesto por Firestore. */
const FIRESTORE_BATCH_LIMIT = 500;

type ProductInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;

@Injectable({ providedIn: 'root' })
export class ProductService {
  private firestore = inject(Firestore);
  private colRef = collection(this.firestore, 'products');

  private readonly _products = signal<Product[]>([]);
  readonly products = this._products.asReadonly();
  readonly activeProducts = computed(() => this._products().filter((p) => p.isActive));

  constructor() {
    connectWhileAuthenticated<QuerySnapshot>(
      'products',
      (next, error) => onSnapshot(this.colRef, next, error),
      (snap) => this._products.set(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product)),
      () => this._products.set([]),
    );
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

  /**
   * Aplica un lote de creaciones/actualizaciones de productos (import de Excel)
   * usando `writeBatch`, en vez de N operaciones sueltas: si una fila del lote
   * falla, ninguna de las escrituras de ese lote queda aplicada (evita duplicados
   * en un reintento, algo que sí podía pasar con `addDoc` individuales).
   * Trocea en lotes de máx. 500 operaciones (límite de Firestore).
   */
  async importProducts(
    rows: { isNew: boolean; existingId: string | null; data: Partial<ProductInput> }[],
  ): Promise<void> {
    for (let i = 0; i < rows.length; i += FIRESTORE_BATCH_LIMIT) {
      const chunk = rows.slice(i, i + FIRESTORE_BATCH_LIMIT);
      const batch = writeBatch(this.firestore);
      for (const row of chunk) {
        if (row.isNew) {
          batch.set(doc(this.colRef), {
            ...row.data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          batch.update(doc(this.firestore, 'products', row.existingId!), {
            ...row.data,
            updatedAt: serverTimestamp(),
          });
        }
      }
      await batch.commit();
    }
  }

  /**
   * Borra TODOS los documentos de la colección /products.
   * Trocea las eliminaciones en lotes de máx. 500 operaciones (límite de Firestore).
   * Retorna la cantidad de productos eliminados.
   */
  async deleteAllProducts(): Promise<number> {
    const snap = await getDocs(this.colRef);
    const docs = snap.docs;

    for (let i = 0; i < docs.length; i += FIRESTORE_BATCH_LIMIT) {
      const chunk = docs.slice(i, i + FIRESTORE_BATCH_LIMIT);
      const batch = writeBatch(this.firestore);
      for (const d of chunk) {
        batch.delete(d.ref);
      }
      await batch.commit();
    }

    return docs.length;
  }
}
