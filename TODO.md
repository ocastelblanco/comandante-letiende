# TODO.md — Planificación Just-In-Time (JIT) de Comandante

Este documento es el motor de planificación del proyecto. Contiene estrictamente las siguientes **dos tareas atómicas** priorizadas. Al finalizar cualquiera de ellas, se reevalúa el estado actual contra el PRD y se calcula la siguiente.

---

## 1. Funcionamiento del Motor JIT
- **Límite de WIP (Work in Progress):** Nunca habrá más de dos tareas activas en este archivo. Esto evita backlogs interminables y estimaciones obsoletas.
- **Flujo de Actualización:** Cuando termines una tarea, muévela a la sección *Historial de Tareas Completadas*, compara `PRD.md` con `MEMORY.md` y redacta la siguiente tarea atómica en la posición libre.
- **Prioridad de Tareas:**
  1.  `[SEGURIDAD]` — Brechas OWASP o reglas de seguridad faltantes.
  2.  `[FEATURE]` — Características prioritarias del roadmap de producto.

---

## 2. Tareas Activas (WIP: 1)

### Tarea 10: [FEATURE] Consolidado de Ventas del Administrador
*   **Origen:** PRD §5.3 — La sección "Reportes" del admin existe como placeholder. Sin ella, el administrador no puede cuadrar caja al cierre de la jornada.
*   **Archivos a Modificar:**
    *   `src/app/features/admin/reports/admin-reports.component.ts` — Reemplazar placeholder con la vista funcional.
    *   `src/app/core/db/order.service.ts` — Añadir método `getOrdersByDate(date: Date): Promise<Order[]>` que consulte Firestore filtrando por `status == 'delivered'` y rango de timestamps del día seleccionado.
    *   `firestore.indexes.json` — Añadir índice compuesto `(status ASC, createdAt ASC)` requerido por la consulta.
*   **Qué construir:**
    1. Selector de fecha (input `type="date"` con valor por defecto = hoy).
    2. Al cambiar la fecha, ejecutar `getOrdersByDate()` y mostrar un spinner mientras carga.
    3. Tabla resumen agrupada por producto: columnas Producto | Cantidad | Base | Propina | Total.
    4. Fila de totales: suma de Base, Propina y Total de todos los productos.
    5. Estado vacío si no hay ventas en esa fecha.
*   **Definición de Done (Checklist):**
    - `[ ]` El administrador puede seleccionar una fecha y ver el consolidado de órdenes entregadas.
    - `[ ]` Los totales de Consumo y Propina son correctos y coinciden con la suma de los pedidos.
    - `[ ]` El índice Firestore está declarado en `firestore.indexes.json` y desplegado.
    - `[ ]` `npm run build` compila sin errores.

---

## 3. Historial de Tareas Completadas

### ✅ Tarea 9: [FEATURE] Indicador de Pago + Cobro Discriminado en Vista del Mesero
*   **Completada:** 2026-05-26
*   **PR:** `feature/waiter-payment-breakdown` (#14)
*   **Resultado:** Tarea redefinida por decisión de producto — el desglose de cobro se integra directamente en el card expandido del mesero (no como pantalla separada). Al desplegar un pedido el mesero ve precio de línea por ítem, Subtotal (base), Propina incluida y Total en negrita, antes del botón «Cobrar». Indicador Pagado / Sin cobrar añadido en las tres interfaces: chip tappable «Cobrar» → «✓ Pagado» en el mesero, badge de solo lectura en barista y admin. Nuevo método `markOrderPaid()` en `OrderService`. Nuevas funciones Firestore `onlyMarksPaid()` y `onlyMarksDelivered()` con regla de update granular para meseros. Reglas desplegadas a staging. Build verde.

### ✅ Tarea 8: [FEATURE] Módulo del Barista — Cola de Preparación
*   **Completada:** 2026-05-26
*   **PR:** `feature/barista-queue`
*   **Resultado:** `BaristaComponent` implementado con layout de dos columnas (Por preparar | En preparación), stacks a una columna en móvil. Cada card muestra identifier, nombre del mesero, chips de ítems, total y botón de acción. `OrderService.updateOrderStatusAsBarista()` escribe `baristaId` + `preparedAt` en la transición a `ready`. `firestore.rules` corregido: bug crítico en `userRole()` — operador `&&` retornaba `bool` en lugar del string del rol, bloqueando todas las escrituras; corregido con operador ternario. Mesero puede marcar órdenes como `delivered` (nuevo `onlyMarksDelivered()` en reglas). Botón de filtro del mesero operativo (alterna entre todos los pedidos y solo los listos). Build verde.

### ✅ Tarea 7: [FEATURE] Adaptación de la App al Estilo Visual de Le Tiende
*   **Completada:** 2026-05-25
*   **PR:** `feature/visual-style-letiende`
*   **Resultado:** Paleta Le Tiende (#230C00 / #E8630A / #00B7A3 / #FFE7B3 / #F7F5F2) aplicada a todos los componentes. Toolbar oscuro + logo en mesero, barista y admin. Admin: shell responsivo con sidebar desktop/bottom-nav mobile, dashboard con tarjetas de métricas, pedidos con `ion-segment` (íconos en móvil + label en desktop), productos con grid 2/3 col, segmento de categorías, overlay de archivado y FAB. Barista: layout dos columnas tablet. Fuentes Plus Jakarta Sans + Poppins via Google Fonts. Tailwind v4 gotchas documentados en CLAUDE.md. Build verde: 1.26 MB inicial.

### ✅ Tarea 6: [FEATURE] Módulo del Mesero — Toma de Pedidos
*   **Completada:** 2026-05-24
*   **PR:** `feature/waiter-order-flow`
*   **Resultado:** Modelos `OrderItem` y `Order` creados con `OrderStatus` type. `OrderService` implementado con `pendingOrders` Signal via `onSnapshot` filtrado a `['pending','preparing']` (sort en memoria, sin índice compuesto), y `createOrder()` que escribe en `/orders` con email y nombre del usuario autenticado. `WaiterComponent` completamente reescrito: catálogo agrupado por categoría via `computed()`, carrito manejado con Signal de `Record<string, CartEntry>`, footer sticky con resumen de ítems y total, formulario de mesa con validación reactiva antes de confirmar, feedback de éxito inline 4 s. Listeners de Firestore desuscritos vía `DestroyRef`. Build verde: 1.26 MB inicial, `waiter-component` 7.97 kB lazy.

### ✅ Tarea 5: [FEATURE] Módulo del Administrador — ABM de Productos y Gestión de Usuarios
*   **Completada:** 2026-05-23
*   **PR:** `feature/admin-abm`
*   **Resultado:** `Product` y `AppUser` models creados. `ProductService` y `UserService` implementados con Signals + `onSnapshot` y cleanup con `DestroyRef`. Vista admin con `IonTabs` (Products / Users). `ProductsComponent` con lista, botón editar y archivar, y formulario reactivo inline. `totalPrice = computed(() => basePrice + tipAmount)` calculado en tiempo real via `toSignal`. `UserListComponent` con selector de rol por inline `ionChange` y formulario de alta de usuarios. `AuthService` actualizado para buscar usuario por email (no UID) en Firestore. `firestore.rules` actualizado: `userRole()` usa `request.auth.token.email`. Build verde: 1.25 MB inicial (sin warnings, budget 1.5 MB), chunks lazy separados por componente.

### ✅ Tarea 4: [FEATURE] Autenticación con Google Sign-In, Lista Blanca y Guardia de Rutas
*   **Completada:** 2026-05-23
*   **PR:** `feature/auth-google-signin`
*   **Resultado:** `AuthService` con `signInWithGoogle()` (verifica existencia en `/users/{email}`), `signOut()` (limpia Signals antes de redirigir a `/login`), y `currentUser`/`isAuthenticated` como Signals. `authGuard` funcional que redirige a `/login` si no autenticado. `LoginComponent` con Ionic UI, manejo de estado loading/error con Signals. Rutas lazy con `loadComponent`. Build verde sin errores.

### ✅ Tarea 3: [FEATURE] Integración de Ionic Framework 8.x y Tailwind CSS 4.x
*   **Completada:** 2026-05-23
*   **PR:** `feature/ionic-tailwind-setup`
*   **Resultado:** `@ionic/angular 8.8.8` instalado. `provideIonicAngular({})` registrado en `app.config.ts`. `IonApp` + `IonRouterOutlet` en el componente raíz. `ionic.bundle.css` (481 selectores `ion-*`) + `src/theme/variables.css` añadidos a `angular.json`. Tailwind CSS 4.x activado vía `@tailwindcss/postcss` en `postcss.config.json` (formato JSON requerido por el builder `@angular/build:application`) y `@import "tailwindcss"` en `styles.css`. Build limpio: 628 KB JS + 43 KB CSS, sin warnings. Budgets actualizados a 1 MB / 3 MB para acomodar Ionic.

### ✅ Tarea 2: [SEGURIDAD] Configuración de Reglas de Seguridad en Cloud Firestore (`firestore.rules`)
*   **Completada:** 2026-05-23
*   **PR:** `claude/first-todo-task-yAA8H`
*   **Resultado:** `firestore.rules` creado con bloqueo por defecto y reglas granulares por colección y rol. `users` y `products`: lectura pública autenticada, escritura solo admin/raíz. `orders`: creación para mesero, actualización de estado para barista, CRUD completo para admin. Función `onlyUpdatesOrderStatus()` limita los campos que barista puede modificar. Validado con el emulador Firestore local. `firestore.indexes.json`, `firebase.json` y `.firebaserc` creados.

### ✅ Tarea 1: [FEATURE] Inicialización del Entorno de Angular 21.2.x e Integración del SDK de Firebase
*   **Completada:** 2026-05-23
*   **PR:** `claude/first-todo-task-yAA8H`
*   **Resultado:** Proyecto Angular 21.2.x bootstrapped con componentes Standalone, routing y TypeScript estricto. @angular/fire 21.0.0-rc.0 + firebase ^12.4.0 instalados. `environment.ts` con placeholders genéricos (sin credenciales privadas). `app.config.ts` con `provideFirebaseApp`, `provideAuth` y `provideFirestore`. Build pasa sin errores. Estructura de directorios core/, features/ y shared/ creada.

---

## 4. Log del Motor JIT

| Fecha | Comparación / Evaluación | Resultado |
| :--- | :--- | :--- |
| 2026-05-22 | Inicialización de la planificación base sobre un repositorio limpio. | Se definen las tareas atómicas Tarea 1 (Setup del proyecto Angular/Firebase) y Tarea 2 (Reglas de Seguridad básicas de Firestore). |
| 2026-05-23 | Tarea 1 completada. Angular 21.2.x + Firebase SDK integrado. Build verde. | Tarea 2 (firestore.rules) pasa a ser la única tarea activa. Se evaluará la siguiente tarea atómica al completarla. |
| 2026-05-23 | Tarea 2 completada. Reglas de Firestore validadas en emulador. Sin brechas de seguridad OWASP pendientes en el stack base. | Tareas 3 (Ionic + Tailwind) y 4 (Auth + lista blanca) redactadas. |
| 2026-05-23 | Tarea 3 completada. Ionic 8.x + Tailwind 4.x integrados. Build limpio sin warnings. Gap principal: sin autenticación ni catálogo de datos el sistema no puede operar. | Tarea 4 (Auth Google + lista blanca — entrada al sistema) y Tarea 5 (Admin: ABM de productos y usuarios — datos necesarios para operar) son las dos tareas más desbloqueadoras. |
| 2026-05-23 | Tareas 4 y 5 completadas. Autenticación operativa, ABM de productos y usuarios funcional. Próximo gap crítico: sin módulo del mesero el flujo de pedidos no puede iniciarse. | Tarea 6 (Módulo del Mesero — toma de pedidos) es la única tarea activa. WIP bajó a 1 al cerrar ambas tareas simultáneamente. |
| 2026-05-24 | Tarea 6 completada. Modelos Order/OrderItem creados. OrderService con onSnapshot filtrado y createOrder(). WaiterComponent reescrito con catálogo por categoría, carrito con Signals, formulario de mesa y feedback de éxito. Build verde: 1.26 MB inicial, waiter-component 7.97 kB lazy. Próximo gap: sin módulo de barista el ciclo de preparación no puede cerrarse. | Tarea 7 (Módulo del Barista — cola de preparación y actualización de estado) calificada como la siguiente tarea atómica. |
| 2026-05-25 | Decisión de producto: aplicar identidad visual oficial de Le Tiende antes de continuar con nuevas funcionalidades. Sistema de diseño disponible en Google Stitch (proyecto "Sistema de Diseño Comandante"). Pantallas de referencia: Dashboard de Mesero v2 y Crear Nuevo Pedido v2. | Tarea 7 redefinida como adaptación visual (CRÍTICO). Tarea de barista renumerada a Tarea 8. WIP sube a 2: visual blocking, barista en cola. |
| 2026-05-26 | Tareas 7 y 8 completadas. Estilo visual Le Tiende aplicado a toda la app. Módulo de barista operativo con bug crítico de Firestore rules resuelto (`&&` retornaba bool). Ciclo completo mesero→barista→entrega funcional. Brechas restantes de Fase 1: pantalla de cobro con discriminación datáfono (§5.1, core diferenciador) y consolidado de ventas del admin (§5.3, cierre de jornada). | Tarea 9 (pantalla de cobro) y Tarea 10 (consolidado) son las dos tareas activas. Tarea 9 es prioridad porque completa el flujo de pago, que es el valor central del producto. |
| 2026-05-26 | Tarea 9 completada (redefinida). Decisión de producto: no crear pantalla separada de cobro; el desglose discriminado (base + propina + total) se integra inline en el card expandido del mesero. Indicador Pagado/Sin cobrar disponible en las tres interfaces. Ciclo de pago completo sin interrumpir el flujo de pedidos. Única brecha restante de Fase 1: consolidado de ventas del admin para cierre de jornada. | WIP baja a 1. Tarea 10 (consolidado de ventas) es la única tarea activa. |
