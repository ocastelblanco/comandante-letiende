export type ItemStatus = 'pending' | 'ready';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  tipAmount: number;
  itemStatus: ItemStatus;
}
