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

// Adición opcional de un producto (ej. "leche vegetal" en un capuchino):
// suma su propio precio al `basePrice` cuando el mesero la selecciona.
export interface ProductAddition {
  addition: string;
  additionPrice: number;
}

export interface Product {
  id: string;
  name: string;
  // Descripción para la carta impresa y la carta digital de letiende.co.
  description: string | null;
  category: ProductCategory;
  // `null` explícito permite limpiar la subcategoría al editar un producto
  // que cambia a una categoría sin subcategorías (comida/repostería).
  subcategory?: ProductSubcategory | null;
  // Opciones excluyentes que no alteran el precio (ej. el estilo de una
  // cerveza artesanal). Vacío si el producto no tiene variantes.
  variants: string[];
  // Extras opcionales que sí suman al precio. Vacío si no aplica.
  additions: ProductAddition[];
  // Precio sin propina: la propina ahora vive en el pedido, no en el producto.
  basePrice: number;
  // Posición de la fila en la hoja `datos` (1 = primera fila de datos). La fija
  // el importador; ausente/null en productos creados a mano o anteriores al
  // primer import con orden. letiende.co ordena la carta con este valor.
  order?: number | null;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
