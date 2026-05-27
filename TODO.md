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

## 2. Tareas Activas (WIP: 0)

---

## 2.5. Cola de Tareas (siguiente ciclo)

*(vacía — Fase 1 completa)*

---

## 3. Historial de Tareas Completadas

### ✅ Tarea 16: [INFRA] Actualizar GitHub Actions a Node.js 24
*   **Completada:** 2026-05-27
*   **PR:** `fix/ci-node24`
*   **Resultado:** Añadida variable de entorno `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: 'true'` a nivel de workflow en `deploy-hosting.yml`. Esto opta anticipadamente al runtime de Node 24 para todos los action-runners (`actions/checkout@v4`, `actions/setup-node@v4`, `FirebaseExtended/action-hosting-deploy@v0`), eliminando el warning de deprecación antes del cutover forzado del 2 de junio de 2026. El build de producción (`node-version: '20'`) no se modifica — esa variable solo afecta el JS runtime del action, no el entorno de build.

### ✅ Tarea 15: [REFACTOR] Migración de estilos inline → Tailwind semántico + variables CSS del tema
*   **Completada:** 2026-05-27
*   **PR:** `refactor/tailwind-theme` (#17)
*   **Resultado:** Bloque `@theme` con 6 tokens nombrados añadido a `styles.css` (`espresso`, `orange`, `teal`, `cream`, `surface`, `purple`). Clase global `ion-button.btn-rounded` para border-radius reutilizable. Todos los colores hexadecimales hardcodeados (`#230C00`, `#E8630A`, `#00B7A3`, `#FFE7B3`, `#F7F5F2`, `#5C2E91`, `#251a00`, `#82746c`) eliminados de los 8 componentes de features y reemplazados por tokens Tailwind (`text-espresso`, `bg-cream`, `bg-orange`, etc.) o variables CSS de Ionic (`--ion-color-primary/secondary/tertiary/light/dark/medium`). Toolbars móviles sin inline styles redundantes. Botones con `color="secondary"/"tertiary"`. `STATUS_BADGE` y `paymentColor()` migrados a CSS vars. Vista móvil de Productos convertida de grid 2-col a lista con botones icono. Build verde.

### ✅ Tarea 13: [INFRA] Reparar step `Deploy Firestore rules` en GitHub Actions
*   **Completada:** 2026-05-27
*   **Causa raíz real:** La SA `firebase-adminsdk-fbsvc@comandante-letiende.iam.gserviceaccount.com` carecía de dos roles: (1) `roles/serviceusage.serviceUsageConsumer` — necesario para que `firebase-tools` verifique que `firestore.googleapis.com` está habilitada vía `serviceusage.services.get`; (2) `roles/firebaserules.admin` — necesario para compilar y publicar las reglas vía `firebaserules.googleapis.com/v1/projects/:test`. Ambos roles añadidos vía Cloud Resource Manager REST API usando el token OAuth del Firebase CLI local.
*   **Resultado:** Todos los steps del workflow `deploy-hosting.yml` pasan en verde: `Instalar dependencias ✓ → Build de producción ✓ → Deploy al canal live ✓ → Deploy Firestore rules ✓`. CI completamente operativo en cada push a `main`.

### ✅ Tarea 14: [INFRA] Apuntar `comandante.letiende.co` → Firebase Hosting (Route 53)
*   **Completada:** 2026-05-27
*   **Resultado:** Dominio personalizado agregado en Firebase Hosting via REST API v1beta1 (`POST /sites/comandante-letiende/domains`). Firebase retornó IP `199.36.158.100` y token ACME `qJRPf2mqjyv992ovUgLeaeCxcg7oxfuVezAbovPcHVs`. Dos registros creados en Route 53 zona `Z010633738KAGFIPOZVEW`: `A comandante.letiende.co → 199.36.158.100` (TTL 300) y `TXT _acme-challenge.comandante.letiende.co` con el token ACME (TTL 300). DNS propagado al instante vía Google (8.8.8.8). Firebase pendiente de emitir certificado SSL (`CERT_PENDING`). El dominio `https://comandante.letiende.co` estará operativo en minutos una vez Firebase complete la verificación.

### ✅ Tarea 12: [FEATURE] Persistencia de Sesión + Logout desde el Avatar
*   **Completada:** 2026-05-27
*   **PR:** `fix/session-persistence` (#16)
*   **Resultado:** `AuthService.ready()` añadido usando `firstValueFrom(authState(this.auth)).then(() => undefined)` — espera el primer evento de Firebase antes de retornar. `authGuard` convertido a `async` y awaita `ready()` antes de evaluar `isAuthenticated()`, eliminando el falso redirect a `/login` al recargar en Chrome macOS y Chrome Android. Logout desde avatar implementado en mesero y barista mediante `IonActionSheet` ("Cerrar sesión" + Cancelar). Admin móvil: botón "Salir" con `log-out-outline` añadido al bottom nav. Build verde: 6 archivos modificados.

### ✅ Tarea 11: [FEATURE] Reporte Detallado por Pedido con Medio de Pago y Rango Fecha/Hora
*   **Completada:** 2026-05-26
*   **Branch:** `feature/sales-consolidado`
*   **Resultado:** `PaymentMethod` type (`card|cash|nequi|daviplata`) y campos `paidAt: Timestamp | null` / `paymentMethod: PaymentMethod | null` añadidos a `Order`. `markOrderPaid()` actualizado para recibir `paymentMethod` y escribir `paidAt: serverTimestamp()`. `getOrdersByDate` reemplazado por `getOrdersByRange(start, end)` filtrando `paid == true` + rango de `paidAt` con `orderBy('paidAt', 'asc')`. Índice `(paid ASC, paidAt ASC)` añadido a `firestore.indexes.json` y desplegado a staging. `onlyMarksPaid()` en reglas actualizado para permitir `paidAt` y `paymentMethod`. Waiter: chip "Cobrar" abre `IonActionSheet` con 4 opciones antes de confirmar cobro. Admin reports: selector de rango con dos `<input type="datetime-local">` (default hoy 00:00–23:59); tabla nueva con una fila por pedido — Pedido | Hora de cobro (`dd/MM HH:mm`, "—" para legados) | Medio de pago (badge coloreado) | Ítems (lista compacta) | Base | Propina | Total. Fila de totales del rango. Build verde: `admin-reports-component` 10.55 kB, `waiter-component` 20.63 kB.

### ✅ Tarea 10: [FEATURE] Consolidado de Ventas del Administrador
*   **Completada:** 2026-05-26
*   **PR:** `feature/sales-consolidado` (#15)
*   **Resultado:** `OrderService.getOrdersByDate()` añadido: consulta Firestore filtrando `status == 'delivered'` + rango de timestamps del día en zona horaria local; usa índice compuesto `(status ASC, createdAt ASC)` ya existente en `firestore.indexes.json`. `AdminReportsComponent` reemplaza placeholder con vista funcional: selector de fecha (default hoy), spinner de carga, tabla agrupada por producto (Producto | Cant. | Base | Propina | Total), fila de totales con propina y total en naranja Le Tiende, estado vacío para días sin ventas. Agrupación por `productId` con sort alfabético `localeCompare('es')`. Build verde: admin-reports-component 8.35 kB lazy.

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
| 2026-05-26 | Tarea 10 completada. Consolidado de ventas operativo: selector de fecha, tabla por producto con discriminación base/propina/total, totales del día. Flujo completo Fase 1 cerrado: mesero toma pedido → barista prepara → mesero entrega y cobra → admin cuadra caja. Evaluar PRD para siguiente ciclo de mejoras. | WIP baja a 0. Fase 1 del producto completada. |
| 2026-05-26 | Feedback operativo post-Fase 1: eventos nocturnos cruzan medianoche (el filtro por día no alcanza), el admin necesita saber cuándo y cómo se pagó cada pedido, y el mesero debe registrar el medio de pago al cobrar. Tres mejoras acopladas: rango datetime libre + tabla por pedido + ActionSheet de medio de pago. Plan documentado en `docs/aumento-detalle-reportes.md`. | Tarea 11 redactada como única tarea activa. |
| 2026-05-26 | Tarea 11 completada. Modelo, servicio, reglas, índices, mesero y reporte del admin actualizados. Índice `(paid ASC, paidAt ASC)` desplegado a staging. Build verde. El flujo completo ahora registra medio de pago y timestamp exacto de cobro, y el admin puede cuadrar caja para eventos que cruzan medianoche. Evaluar PRD para siguiente ciclo. | WIP baja a 0. |
| 2026-05-27 | Tarea 12 completada. `AuthService.ready()` añadido usando `firstValueFrom(authState)` — el guard ahora awaita la inicialización de Firebase antes de evaluar `isAuthenticated()`, eliminando el falso redirect a `/login` al recargar. Logout desde avatar implementado en mesero (ActionSheet existente) y barista (ActionSheetController inyectado); admin móvil tiene botón "Salir" en bottom nav. PR #16 abierto. Build verde. | WIP baja a 1. Tarea 13 (deploy_live) queda como única activa. |
| 2026-05-27 | Tarea 13 completada. SA `firebase-adminsdk-fbsvc` carecía de `roles/serviceusage.serviceUsageConsumer` (error 1) y `roles/firebaserules.admin` (error 2). Ambos roles añadidos vía Cloud Resource Manager API en dos iteraciones. CI verde: todos los steps pasan. WIP baja a 0. Única tarea en cola: Tarea 15 (Tailwind refactor). | WIP = 0. Fase de estabilización completa. |
| 2026-05-27 | Tarea 14 completada. Dominio `comandante.letiende.co` agregado en Firebase Hosting via REST API. Registros `A → 199.36.158.100` y `TXT _acme-challenge` creados en Route 53. DNS propagado al instante. Firebase emitiendo certificado SSL (`CERT_PENDING`). Tarea 13 (IAM fix para Firestore rules en CI) pasa a ser la única activa. | WIP se mantiene en 1. |
| 2026-05-27 | Análisis de dependencias Tarea 13 vs 14: el step de hosting del workflow ya funciona (usa la GitHub Action); solo el step de Firestore rules da 403. El dominio personalizado no necesita CI verde — solo que el hosting exista. DNS puede tardar 48 h → iniciar antes ahorra tiempo. Orden invertido: 14 (DNS) → 13 (IAM fix). | Tarea 14 pasa a activa. Tarea 13 pasa a cola. WIP se mantiene en 1. |
| 2026-05-27 | PR #16 (`fix/session-persistence`) fusionado a `main`. Repo local limpiado: `main` actualizado con fast-forward (3 commits), rama local `fix/session-persistence` eliminada. Única tarea activa restante: Tarea 13 (deploy_live 403). | WIP se mantiene en 1. Tarea 13 es la próxima a ejecutar. |
| 2026-05-27 | Feedback operativo post-merge de `feature/sales-consolidado`: (1) sesión no persiste al recargar navegador en macOS ni Android — bug crítico de usabilidad; (2) sin opción de cerrar sesión en waiter/barista/admin-móvil; (3) GitHub Action `deploy_live` falla con 403 en IAM — bloquea publicación en producción; (4) DNS de `comandante.letiende.co` sin configurar en Route 53; (5) estilos inline caóticos — hardcoded hex en lugar de variables del tema. Cuatro tareas agrupadas en dos activas + dos en cola. | WIP sube a 2. Tareas 12 (sesión+logout) y 13 (deploy_live) como activas. Tareas 14 (Route 53) y 15 (Tailwind refactor) en cola. |
