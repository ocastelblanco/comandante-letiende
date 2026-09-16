import { Timestamp } from '@angular/fire/firestore';

export type ProductCategory =
  | 'bebidas'
  | 'cocteles'
  | 'licores'
  | 'cervezas'
  | 'comida'
  | 'reposteria'
  | 'ofertas';

export type ProductSubcategory =
  | 'de_cafe'
  | 'calientes'
  | 'frias'
  | 'clasicos'
  | 'de_autor'
  | 'premium'
  | 'trago'
  | 'botella'
  | 'nacionales'
  | 'importadas'
  | 'artesanales'
  | 'combos'
  | 'promociones';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  // `null` explícito permite limpiar la subcategoría al editar un producto
  // que cambia a una categoría sin subcategorías (comida/repostería).
  subcategory?: ProductSubcategory | null;
  basePrice: number;
  tipAmount: number;
  totalPrice: number;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
