import { PaymentMethod } from './order.model';

// Medios de pago aceptados: única fuente de verdad para el action sheet de
// cobro del mesero y los reportes de administración (Tarea 31).

export interface PaymentMethodOption {
  readonly value: PaymentMethod;
  readonly label: string;
  readonly icon: string;   // nombre de ionicon
  readonly color: string;  // var(--ion-color-...) u otra variable CSS del tema
}

export const PAYMENT_METHODS: readonly PaymentMethodOption[] = [
  { value: 'datafono', label: 'Datáfono', icon: 'card-outline', color: 'var(--ion-color-secondary)' },
  { value: 'qr', label: 'QR', icon: 'qr-code-outline', color: 'var(--color-purple)' },
  { value: 'efectivo', label: 'Efectivo', icon: 'cash-outline', color: 'var(--ion-color-tertiary)' },
];

export function getPaymentMethodOption(value: string | null | undefined): PaymentMethodOption | undefined {
  return PAYMENT_METHODS.find((m) => m.value === value);
}

export function paymentMethodLabel(value: string | null | undefined): string {
  return getPaymentMethodOption(value)?.label ?? '—';
}

export function paymentMethodColor(value: string | null | undefined): string {
  return getPaymentMethodOption(value)?.color ?? 'var(--ion-color-medium)';
}
