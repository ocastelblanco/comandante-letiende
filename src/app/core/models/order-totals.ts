// Cálculo de propina y total del pedido. Función pura para que sea
// testeable sin TestBed ni Firestore — ver order-totals.spec.ts.
//
// El peso colombiano no maneja centavos, así que la propina porcentual
// se redondea con Math.round ANTES de sumarle el valor absoluto: si se
// redondeara después, un tipValue con decimales (que no debería existir,
// pero el input es numérico y no lo impide) podría desalinear el total.

export interface OrderTotals {
  subtotal: number;
  tipAmount: number;
  total: number;
}

export function computeOrderTotals(
  subtotal: number,
  tipPercentage: number,
  tipValue: number,
): OrderTotals {
  const tipAmount = Math.round((subtotal * tipPercentage) / 100) + tipValue;
  return {
    subtotal,
    tipAmount,
    total: subtotal + tipAmount,
  };
}
