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

### Tarea 1: [FEATURE] Inicialización del Entorno de Angular 21.2.x e Integración del SDK de Firebase
*   **Origen:** PRD §1 (Visión) & tech-specs.md §2 (Stack Tecnológico)
*   **Archivos a Crear/Modificar:**
    *   `[NEW]` `package.json` / `angular.json` / `tsconfig.json` (mediante inicialización del CLI de Angular)
    *   `[NEW]` `src/app/app.config.ts` (configuración del bootstrap e inyección de Firebase providers)
    *   `[NEW]` `src/environments/environment.ts` (archivo con llaves de configuración del cliente Firebase)
*   **Qué hacer:**
    1.  Crear el proyecto Angular en el directorio actual utilizando standalone components por defecto.
    2.  Instalar las dependencias core `@angular/fire` y `firebase`.
    3.  Configurar en `src/environments/environment.ts` las credenciales públicas del proyecto Firebase (vacías o genéricas para ser rellenadas luego).
    4.  Habilitar los proveedores `provideFirebaseApp`, `provideAuth` y `provideFirestore` en `app.config.ts`.
*   **Definición de Done (Checklist):**
    - `[x]` La aplicación compila sin errores ejecutando `npm run build`.
    - `[x]` `app.config.ts` inicializa correctamente el cliente de Firebase sin fallos de importación.
    - `[x]` Las variables de entorno de Firebase están expuestas de forma segura en `environment.ts` sin contener llaves de acceso administrativo o llaves privadas.

---

### Tarea 2: [SEGURIDAD] Configuración de Reglas de Seguridad en Cloud Firestore (`firestore.rules`)
*   **Origen:** CLAUDE.md §5 (Seguridad OWASP) & tech-specs.md §8 (Autenticación y Seguridad)
*   **Archivos a Crear/Modificar:**
    *   `[NEW]` `firestore.rules` (Reglas del motor de base de datos)
    *   `[NEW]` `firestore.indexes.json` (Archivo de definición de índices de consulta de Firestore)
*   **Qué hacer:**
    1.  Crear el archivo `firestore.rules` en la raíz del proyecto.
    2.  Definir reglas que bloqueen por defecto cualquier lectura/escritura (`allow read, write: if false;`).
    3.  Implementar reglas específicas para cada rol, incorporando la excepción del administrador semilla `letiende.co@gmail.com` para evitar el bloqueo inicial del sistema:
        - Colección `users`: Solo lectura para usuarios autenticados; escrituras y altas permitidas únicamente para administradores o el correo raíz.
        - Colección `products`: Lectura para cualquier usuario autenticado; escrituras permitidas únicamente para administradores o el correo raíz.
        - Colección `orders`: Lectura y creación para el rol `waiter`; lectura y actualización de estado para el rol `barista`; lectura y escritura total para administradores o el correo raíz.
*   **Definición de Done (Checklist):**
    - `[ ]` El archivo `firestore.rules` pasa la validación sintáctica del simulador de Firebase.
    - `[ ]` No existen reglas laxas del tipo `allow read, write: if request.auth != null;` aplicadas de forma generalizada sobre todas las colecciones.

---

## 3. Historial de Tareas Completadas

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
