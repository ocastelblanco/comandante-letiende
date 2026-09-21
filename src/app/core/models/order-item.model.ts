import { ProductAddition } from './product.model';

export type ItemStatus = 'pending' | 'ready';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  // Variante elegida, o `null` si el producto no tiene variantes.
  // Obligatoria (no `null`) cuando `Product.variants` no está vacío.
  variant: string | null;
  // Adiciones seleccionadas por el mesero, con su precio ya denormalizado.
  additions: ProductAddition[];
  // Precio unitario = basePrice del producto + Σ additionPrice de las
  // adiciones seleccionadas. Ya NO incluye propina: la propina vive en
  // el pedido (Order.tipAmount), no por ítem.
  unitPrice: number;
  itemStatus: ItemStatus;
}
