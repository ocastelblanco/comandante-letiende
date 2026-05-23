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

### Tarea 3: [FEATURE] Integración de Ionic Framework 8.x y Tailwind CSS 4.x
*   **Origen:** tech-specs.md §2 (Stack Tecnológico) & MEMORY.md ADR-002 — Base obligatoria para todas las vistas de UI.
*   **Archivos a Crear/Modificar:**
    *   `[MOD]` `package.json` — Agregar `@ionic/angular`, `@ionic/core`, `ionicons`, `tailwindcss` y `@tailwindcss/vite`.
    *   `[MOD]` `src/app/app.config.ts` — Registrar `provideIonicAngular`.
    *   `[MOD]` `src/app/app.component.ts` — Importar e incluir `IonApp`, `IonContent` y `IonRouterOutlet`.
    *   `[MOD]` `src/app/app.component.html` — Reemplazar la plantilla por `<ion-app><ion-router-outlet /></ion-app>`.
    *   `[MOD]` `angular.json` — Incluir el CSS global de Ionic en la sección `styles`.
    *   `[MOD]` `src/styles.css` — Agregar `@import "tailwindcss"` para activar Tailwind v4.
    *   `[NEW]` `src/theme/variables.css` — Variables de color de Ionic personalizadas para la identidad visual de Le Tiende.
*   **Qué hacer:**
    1.  Instalar las dependencias de Ionic 8.x (`@ionic/angular`, `@ionic/core`, `ionicons`).
    2.  Instalar Tailwind CSS 4.x (`tailwindcss`, `@tailwindcss/vite`).
    3.  Configurar `@tailwindcss/vite` como plugin en el builder de Angular (vía `angular.json`).
    4.  Registrar `provideIonicAngular({})` en los providers de `app.config.ts`.
    5.  Envolver la aplicación en `<ion-app>` y `<ion-router-outlet>` en `app.component`.
    6.  Definir las variables de tema de Ionic en `src/theme/variables.css` con colores de Le Tiende.
*   **Definición de Done (Checklist):**
    - `[ ]` `npm run build` compila sin errores con Ionic y Tailwind.
    - `[ ]` Al inspeccionar `dist/`, se incluyen los estilos de Ionic y las clases de Tailwind utilizadas.
    - `[ ]` El componente raíz renderiza `<ion-app>` sin errores en consola.

---

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

## 3. Historial de Tareas Completadas

### ✅ Tarea 2: [SEGURIDAD] Configuración de Reglas de Seguridad en Cloud Firestore (`firestore.rules`)
*   **Completada:** 2026-05-23
*   **PR:** `claude/first-todo-task-yAA8H`
*   **Resultado:** `firestore.rules` creado con bloqueo por defecto y reglas granulares por colección y rol. `users` y `products`: lectura pública autenticada, escritura solo admin/raíz. `orders`: creación para mesero, actualización de estado para barista, CRUD completo para admin. Función `onlyUpdatesOrderStatus()` limita los campos que barista puede modificar. Validado con el emulador Firestore local (arrancó sin errores de parseo). `firestore.indexes.json` con 3 índices compuestos para queries de la cola de barra. `firebase.json` y `.firebaserc` creados con placeholders de proyectos. `firebase-tools` agregado como devDependency.

### ✅ Tarea 1: [FEATURE] Inicialización del Entorno de Angular 21.2.x e Integración del SDK de Firebase
*   **Completada:** 2026-05-23
*   **PR:** `claude/first-todo-task-yAA8H`
*   **Resultado:** Proyecto Angular 21.2.x bootstrapped con componentes Standalone, routing y TypeScript estricto. @angular/fire 21.0.0-rc.0 + firebase ^12.4.0 instalados. `environment.ts` con placeholders genéricos (sin credenciales privadas). `app.config.ts` con `provideFirebaseApp`, `provideAuth` y `provideFirestore`. Build pasa sin errores en 5.1 s. Estructura de directorios core/, features/ y shared/ creada.

---

## 4. Log del Motor JIT

| Fecha | Comparación / Evaluación | Resultado |
| :--- | :--- | :--- |
| 2026-05-22 | Inicialización de la planificación base sobre un repositorio limpio. | Se definen las tareas atómicas Tarea 1 (Setup del proyecto Angular/Firebase) y Tarea 2 (Reglas de Seguridad básicas de Firestore). |
| 2026-05-23 | Tarea 1 completada. Angular 21.2.x + Firebase SDK integrado. Build verde. | Tarea 2 (firestore.rules) pasa a ser la única tarea activa. Se evaluará la siguiente tarea atómica al completarla. |
| 2026-05-23 | Tarea 2 completada. Reglas de Firestore validadas en emulador. Sin brechas de seguridad pendientes en el stack base. PRD §8.2 cubierto. Gap principal: no hay UI ni autenticación — sin estas dos piezas no puede operar ningún módulo funcional. | Tarea 3 (Ionic + Tailwind — base de UI) y Tarea 4 (Auth con Google + lista blanca) son las siguientes tareas más desbloqueadoras. Ambas son FEATURE ya que las brechas de seguridad OWASP del stack base están cubiertas. |
