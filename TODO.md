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

### Tarea 6: [FEATURE] Módulo del Mesero — Toma de Pedidos
*   **Origen:** PRD §5.1 (Módulo del Mesero) — Función central del sistema; sin toma de pedidos el flujo de trabajo completo (mesero → barista → cobro) no puede operar.
*   **Archivos a Crear/Modificar:**
    *   `[NEW]` `src/app/core/models/order.model.ts` — Interface `Order` con campos `id`, `tableNumber`, `items` (array de `OrderItem`), `status`, `waiterId`, `createdAt`, `updatedAt`.
    *   `[NEW]` `src/app/core/models/order-item.model.ts` — Interface `OrderItem` con campos `productId`, `productName`, `quantity`, `unitPrice`, `tipAmount`.
    *   `[NEW]` `src/app/core/db/order.service.ts` — Servicio para crear y listar pedidos del turno activo usando Signals + Firestore.
    *   `[MOD]` `src/app/features/waiter/waiter.component.ts` — Vista móvil: catálogo de productos activos, carrito de pedido, confirmación de envío.
*   **Qué hacer:**
    1.  Definir los modelos `Order` y `OrderItem`.
    2.  Implementar `OrderService` con `createOrder()` y `pendingOrders` (Signal con onSnapshot filtrado por status `pending`/`preparing`).
    3.  Construir la vista del mesero: lista de productos activos por categoría, botón "Agregar al pedido", resumen del carrito y botón "Enviar pedido".
    4.  Al enviar el pedido, escribir en `/orders` con status `pending` y los datos del mesero autenticado.
*   **Definición de Done (Checklist):**
    - `[ ]` El mesero puede seleccionar productos del catálogo y ver el total automático.
    - `[ ]` Al confirmar, el pedido aparece en Firestore con status `pending`.
    - `[ ]` Los listeners de Firestore se desuscriben al destruir el componente.
    - `[ ]` `npm run build` compila sin errores.

---

## 3. Historial de Tareas Completadas

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
