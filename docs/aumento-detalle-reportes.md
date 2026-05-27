# Plan: Aumento de Detalle en Reportes

**Contexto:** Los eventos de Le Tiende no siempre terminan el mismo día. Se necesita (1) filtrar por rango fecha/hora arbitrario, (2) mostrar el reporte desglosado por pedido pagado con hora de pago, y (3) registrar y mostrar el medio de pago por pedido. Este documento describe todos los cambios necesarios antes de escribir una línea de código.

---

## 1. Cambios en el Modelo de Datos

### `src/app/core/models/order.model.ts`
- Añadir tipo `PaymentMethod = 'card' | 'cash' | 'nequi' | 'daviplata'`
- Añadir campos a la interfaz `Order`:
  - `paymentMethod: PaymentMethod | null` — medio de pago registrado al cobrar
  - `paidAt: Timestamp | null` — timestamp exacto del cobro

### Impacto en documentos existentes en Firestore
Los pedidos creados antes de este cambio no tendrán `paymentMethod` ni `paidAt`. El código debe tratarlos como `null` sin romper (opcional chain o `?? null`).

---

## 2. Backend — `src/app/core/db/order.service.ts`

### Modificar `markOrderPaid(orderId, paymentMethod)`
Firma actual: `markOrderPaid(orderId: string)`  
Firma nueva: `markOrderPaid(orderId: string, paymentMethod: PaymentMethod)`  
Campos que escribe: `paid: true`, `paymentMethod`, `paidAt: serverTimestamp()`, `updatedAt: serverTimestamp()`

### Reemplazar `getOrdersByDate` por `getOrdersByRange`
Firma nueva: `getOrdersByRange(start: Date, end: Date): Promise<Order[]>`  
Query: `where('paid', '==', true)` + `where('paidAt', '>=', Timestamp.fromDate(start))` + `where('paidAt', '<=', Timestamp.fromDate(end))`  
Orden: `orderBy('paidAt', 'asc')` (requiere que el índice incluya `paidAt`)

> **Nota:** El filtro usa `paidAt` (no `createdAt`) porque el rango del reporte representa cuándo se cobró cada pedido, no cuándo se ordenó.

---

## 3. Seguridad — `firestore.rules`

### Actualizar `onlyMarksPaid()`
Añadir `paidAt` y `paymentMethod` a la lista de campos permitidos:
```
let allowed = ['paid', 'paidAt', 'paymentMethod', 'updatedAt'];
```
El resto de la lógica no cambia (`paid: false → true`).

---

## 4. Índices — `firestore.indexes.json`

Añadir índice compuesto requerido por `getOrdersByRange`:
```json
{
  "collectionGroup": "orders",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "paid",   "order": "ASCENDING" },
    { "fieldPath": "paidAt", "order": "ASCENDING" }
  ]
}
```
Desplegar con `firebase deploy --only firestore:indexes -P staging` al finalizar.

---

## 5. Interfaz del Mesero — `waiter.component.ts`

### Flujo actual
Chip "Cobrar" → llama directamente a `markOrderPaid(order.id)`

### Flujo nuevo
Chip "Cobrar" → abre `IonActionSheet` con cuatro opciones → al confirmar llama a `markOrderPaid(order.id, selectedMethod)`

### Opciones del IonActionSheet
| Label | Value |
|---|---|
| 💳 Datáfono | `'card'` |
| 💵 Efectivo | `'cash'` |
| 📱 Nequi | `'nequi'` |
| 📱 Daviplata | `'daviplata'` |

El sheet incluye un botón "Cancelar" que descarta sin cobrar.

**Imports nuevos necesarios:** `ActionSheetController` de `@ionic/angular/standalone`.

---

## 6. Interfaz del Administrador — `admin-reports.component.ts`

### Selector de rango fecha/hora
Reemplazar el único `<input type="date">` por dos `<input type="datetime-local">`:
- **Inicio:** default = hoy a las `00:00`
- **Cierre:** default = hoy a las `23:59`
- El administrador puede ajustar libremente para cubrir eventos nocturnos (ej. 20:00 del sábado → 04:00 del domingo).
- Al cambiar cualquiera de los dos, se recarga el reporte.

### Layout del reporte: por pedido (no por producto)
Cada pedido pagado dentro del rango es una fila/card. La tabla cambia de estructura:

| Pedido | Hora de cobro | Medio de pago | Ítems | Base | Propina | Total |
|---|---|---|---|---|---|---|
| Mesa 5 | 26/05 22:15 | Datáfono | Café ×2, Tostada ×1 | $14.000 | $1.400 | $15.400 |

- **Pedido:** `order.tableNumber`
- **Hora de cobro:** `paidAt` formateado como `dd/MM HH:mm` (ej. "26/05 22:15"). Para pedidos sin `paidAt` (anteriores al cambio), mostrar "—".
- **Medio de pago:** badge de color según método:
  - Datáfono → naranja Le Tiende (`#E8630A`)
  - Efectivo → verde (`#00B7A3`)
  - Nequi / Daviplata → morado (`#5C2E91`)
  - Sin dato → gris
- **Ítems:** lista compacta en una sola celda, separada por comas.
- **Base / Propina / Total:** calculados de `item.unitPrice`, `item.tipAmount`, `item.quantity`.

Fila de totales al pie: suma de Base, Propina y Total de todos los pedidos del rango.

---

## 7. Archivos Afectados (resumen)

| Archivo | Tipo de cambio |
|---|---|
| `src/app/core/models/order.model.ts` | Añadir `PaymentMethod` type + campos `paymentMethod`, `paidAt` |
| `src/app/core/db/order.service.ts` | Actualizar `markOrderPaid()`, reemplazar `getOrdersByDate` → `getOrdersByRange` |
| `firestore.rules` | Actualizar `onlyMarksPaid()` |
| `firestore.indexes.json` | Añadir índice `(paid ASC, paidAt ASC)` |
| `src/app/features/waiter/waiter.component.ts` | Añadir `ActionSheetController` + flujo de selección de medio de pago |
| `src/app/features/admin/reports/admin-reports.component.ts` | Selector de rango datetime-local + tabla por pedido |

---

## 8. Orden de Implementación Sugerido

1. **Modelo** — añadir `PaymentMethod`, `paidAt`, `paymentMethod` a `order.model.ts`
2. **Reglas + índices** — actualizar `firestore.rules` y `firestore.indexes.json`, desplegar
3. **Service** — actualizar `markOrderPaid()` y añadir `getOrdersByRange()`
4. **Mesero** — ActionSheet de medio de pago
5. **Admin reports** — selector de rango + tabla por pedido
6. **Build + verificación**
