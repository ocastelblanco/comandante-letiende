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

## 2. Tareas Activas (WIP: 2)

### Tarea 4: [FEATURE] Autenticación con Google Sign-In, Lista Blanca y Guardia de Rutas
*   **Origen:** PRD §5.1 (Inicio de sesión), §8.2 (Seguridad) & MEMORY.md ADR-004 — Sin autenticación no puede activarse ningún módulo funcional.
*   **Archivos a Crear/Modificar:**
    *   `[NEW]` `src/app/core/auth/auth.service.ts` — Servicio que encapsula `signInWithPopup` (Google), `signOut` y la verificación de lista blanca en Firestore.
    *   `[NEW]` `src/app/core/auth/auth.guard.ts` — Guardia funcional de Angular que redirige a `/login` si el usuario no está autenticado o no está en la lista blanca.
    *   `[NEW]` `src/app/features/login/login.component.ts` — Página de inicio de sesión con botón "Ingresar con Google".
    *   `[MOD]` `src/app/app.routes.ts` — Rutas protegidas por `authGuard`; ruta `/login` pública; redirección raíz a `/login`.
*   **Qué hacer:**
    1.  Crear `AuthService` con métodos `signInWithGoogle()`, `signOut()` (con limpieza de Signal), `isAuthenticated` (Signal<boolean>) y `currentUser` (Signal<User | null>).
    2.  En `signInWithGoogle()`, tras el login exitoso, verificar que el email del usuario existe como documento en la colección `/users` de Firestore. Si no existe, invocar `signOut()` y lanzar un error claro.
    3.  Crear `authGuard` que use `AuthService.isAuthenticated` para proteger rutas.
    4.  Crear componente `LoginComponent` con el botón de Google y manejo de errores visible para el usuario (correo no autorizado, fallo de red).
    5.  Configurar las rutas en `app.routes.ts` con carga diferida (`loadComponent`) para las vistas de cada rol.
*   **Definición de Done (Checklist):**
    - `[ ]` Un usuario no autenticado es redirigido a `/login` al intentar acceder a cualquier ruta protegida.
    - `[ ]` Un usuario autenticado cuyo email NO está en la colección `/users` de Firestore es desconectado y ve el mensaje de error.
    - `[ ]` Al cerrar sesión, `signOut(auth)` se invoca, el Signal `isAuthenticated` pasa a `false` y el usuario es redirigido a `/login`.
    - `[ ]` `npm run build` compila sin errores.

---

### Tarea 5: [FEATURE] Módulo del Administrador — ABM de Productos y Gestión de Usuarios
*   **Origen:** PRD §5.3 (Módulo de Administración) — Prerequisito para que el sistema tenga datos con los que operar; sin catálogo de productos el mesero no puede tomar pedidos.
*   **Archivos a Crear/Modificar:**
    *   `[NEW]` `src/app/core/models/product.model.ts` — Interface `Product` con campos `id`, `name`, `basePrice`, `tipAmount`, `totalPrice`, `category`, `isActive`.
    *   `[NEW]` `src/app/core/models/user.model.ts` — Interface `AppUser` con campos `uid`, `email`, `displayName`, `role`, `createdAt`.
    *   `[NEW]` `src/app/core/db/product.service.ts` — CRUD de productos sobre la colección `/products` usando Signals + Firestore.
    *   `[NEW]` `src/app/core/db/user.service.ts` — CRUD de usuarios sobre la colección `/users` usando Signals + Firestore.
    *   `[NEW]` `src/app/features/admin/admin.component.ts` — Vista de escritorio del administrador con tabs: Productos y Usuarios.
    *   `[NEW]` `src/app/features/admin/products/product-form.component.ts` — Formulario reactivo para crear/editar producto.
    *   `[NEW]` `src/app/features/admin/users/user-list.component.ts` — Lista de usuarios con selector de rol dinámico.
*   **Qué hacer:**
    1.  Definir las interfaces `Product` y `AppUser` en `core/models/`.
    2.  Implementar `ProductService` con `getProducts()` (onSnapshot → Signal), `addProduct()`, `updateProduct()`, `archiveProduct()`. Desuscribirse del listener al destruir el servicio.
    3.  Implementar `UserService` con `getUsers()` (onSnapshot → Signal), `createUser()`, `updateUserRole()`.
    4.  Construir la vista de admin con `IonTabs` para navegar entre Productos y Usuarios.
    5.  El formulario de producto debe calcular automáticamente `totalPrice = basePrice + tipAmount` en tiempo real.
    6.  El selector de rol de usuario debe invocar `UserService.updateUserRole()` directamente (sin formulario intermedio).
*   **Definición de Done (Checklist):**
    - `[ ]` El administrador puede crear, editar y archivar un producto desde la interfaz.
    - `[ ]` El administrador puede cambiar el rol de un usuario (waiter, barista, admin).
    - `[ ]` Los listeners de Firestore se desuscriben al destruir los componentes (sin memory leaks).
    - `[ ]` `npm run build` compila sin errores.

---

## 3. Historial de Tareas Completadas

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
