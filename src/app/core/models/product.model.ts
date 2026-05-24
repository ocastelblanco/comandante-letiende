import { Timestamp } from '@angular/fire/firestore';

export type ProductCategory = 'bebidas' | 'licores' | 'comida' | 'otros';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  basePrice: number;
  tipAmount: number;
  totalPrice: number;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
