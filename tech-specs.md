# Especificaciones Técnicas (tech-specs.md) — Comandante

Este documento define la arquitectura técnica, las herramientas y los patrones de desarrollo para la implementación del sistema **Comandante**.

---

## 1. Visión General de la Arquitectura

El sistema está diseñado bajo una arquitectura de Cliente-Servidor Serverless, utilizando **Angular 21.2.x** para el cliente (múltiples roles en una sola aplicación web progresiva) y **Firebase** como plataforma de servicios backend en tiempo real.

```
+-------------------------------------------------------------------------------+
|                                CAPA CLIENTE                                   |
|                                                                               |
|   +-----------------------+ +-----------------------+ +--------------------+  |
|   |   Mesero App (Móvil)  | | Barista App (Tablet)  | | Admin App (Desktop)|  |
|   |                       | |                       | |                    |  |
|   |  - Toma de pedidos    | |  - Cola de pedidos    | |  - Catálogo de prod|  |
|   |  - Visualiza estados  | |  - Marcar listos      | |  - Control usuarios|  |
|   |  - Split propina      | |  - Tiempos de prep.   | |  - Consolidado POS |  |
|   +-----------------------+ +-----------------------+ +--------------------+  |
|               |                         |                        |            |
|               +-------------------------+------------------------+            |
|                                         |                                     |
+-----------------------------------------|-------------------------------------+
                                          | HTTPS / WebSockets (Firestore SDK)
+-----------------------------------------|-------------------------------------+
|                                CAPA SERVICIO                                  |
|                                         v                                     |
|   +-----------------------------------------------------------------------+   |
|   |                        Firebase API / Services                        |   |
|   |                                                                       |   |
|   |  +--------------------+  +--------------------+  +-----------------+  |   |
|   |  | Firebase Auth      |  | Cloud Firestore    |  | Firebase Hosting|  |   |
|   |  | (Google Sign-In    |  | (Base de datos No  |  | (Despliegue de  |  |   |
|   |  | filtrado por Admin)|  | SQL en tiempo real)|  | archivos estát.)|  |   |
|   |  +--------------------+  +--------------------+  +-----------------+  |   |
|   +-----------------------------------------------------------------------+   |
+-------------------------------------------------------------------------------+
```

---

## 2. Stack Tecnológico Completo

| Componente | Tecnología | Versión | Propósito / Justificación | Enlace a Documentación |
| :--- | :--- | :--- | :--- | :--- |
| **Framework Base** | Angular | 21.2.x (Estable) | Core del desarrollo. Proporciona reactividad mediante *Signals*, componentes Standalone y alto rendimiento en el cliente. | [Docs Angular](https://angular.dev) |
| **Framework de UI** | Ionic Framework (Angular) | 8.x | Proporciona componentes nativos y optimizados para dispositivos táctiles móviles, resolviendo problemas de clicks fantasmas y layouts de pantalla. | [Docs Ionic](https://ionicframework.com/docs) |
| **Estilos CSS** | Tailwind CSS | 4.x | Estilos rápidos, responsivos y consistentes sin escribir clases personalizadas masivas. | [Docs Tailwind](https://tailwindcss.com) |
| **Base de Datos** | Cloud Firestore | SDK v10+ | Almacenamiento de documentos en tiempo real (necesario para la mensajería instantánea de pedidos entre mesero y barista sin backend clásico). | [Docs Firestore](https://firebase.google.com/docs/firestore) |
| **Autenticación** | Firebase Authentication | SDK v10+ | Autenticación con cuentas de Google (Gmail) para mitigar el mantenimiento de contraseñas. | [Docs Firebase Auth](https://firebase.google.com/docs/auth) |
| **Hosting** | Firebase Hosting | - | Alojamiento CDN de alta disponibilidad y bajo costo con soporte SSL automático. | [Docs Hosting](https://firebase.google.com/docs/hosting) |

---

## 3. Estructura del Repositorio Comentada

Aplicación Angular de componentes Standalone, más una carpeta `functions/` con la única Cloud Function del proyecto.

```
comandante/
├── docs/                         # Documentación de trabajo y especificaciones de cambios
├── functions/                    # Cloud Functions (Gen2, Node 24) — proyecto npm independiente
│   ├── src/index.ts              # `publicMenu`: sirve GET /menu.json (ver §12)
│   ├── package.json              # engines.node = "24"
│   └── tsconfig.json
├── patches/                      # patch-package: arreglo del import ESM de @ionic/angular
├── public/                       # Servido tal cual por Hosting: robots.txt, llms.txt, logos, favicon
├── scripts/
│   └── firestore-admin/          # Herramienta local de limpieza de colecciones (no versiona secretos)
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── auth/             # auth.service.ts, auth.guard.ts
│   │   │   ├── db/               # order.service.ts, product.service.ts, user.service.ts
│   │   │   └── models/           # Interfaces + category-tree.ts (fuente única de categorías)
│   │   ├── features/             # Una carpeta por perfil de usuario
│   │   │   ├── admin/            # dashboard, orders, products, reports, users
│   │   │   ├── barista/
│   │   │   ├── login/
│   │   │   └── waiter/
│   │   ├── app.config.ts
│   │   ├── app.routes.ts
│   │   └── app.component.ts
│   ├── environments/             # environment.ts (config de Firebase del cliente)
│   ├── theme/variables.css       # Variables CSS del tema de Ionic
│   ├── styles.css                # @import "tailwindcss" + tokens @theme
│   ├── index.html
│   └── main.ts
├── firebase.json                 # Hosting, rewrites (/menu.json), headers, functions
├── firestore.rules               # Autorización real del sistema
├── firestore.indexes.json
├── postcss.config.json           # Tailwind v4 (ver CLAUDE.md §7: debe ser JSON, no .js)
├── vitest.config.ts              # Runner de pruebas
├── CLAUDE.md · PRD.md · MEMORY.md · TODO.md · DESIGN.md
├── angular.json · package.json · tsconfig*.json
└── LICENSE                       # Apache 2.0
```

**No hay alias de rutas.** `tsconfig.json` no declara `paths`; los imports entre módulos son relativos (`../../core/models/product.model`). Tampoco existe una carpeta `shared/`: el proyecto es lo bastante pequeño como para que cada componente sea autónomo.

**No hay `tailwind.config.js`.** Tailwind v4 se configura con `@theme` dentro de `src/styles.css` y se activa con `postcss.config.json`.

## 4. Frontend / Cliente

### 4.1. Patrones Arquitectónicos
- **Reactive State con Angular Signals:** Toda la gestión de estado de la UI (pedidos locales en el mesero, cola activa del barista, productos cargados) utiliza `Signal` e `WritableSignal` para garantizar renders precisos sin sobrecargar el procesador del dispositivo móvil.
- **Servicios Unidireccionales de Datos (Data Services):** Los componentes no consumen Firebase directamente. Utilizan servicios inyectados en `@core/db/` que exponen `ReadOnly` Signals del estado sincronizado de Firestore.
- **Componentes de Presentación (Dumb) y Contenedores (Smart):** Las vistas principales en `features/` manejan la lógica y el estado (Smart), delegando la renderización de elementos visuales (tarjetas de productos, items de comanda) a subcomponentes reutilizables en `shared/` (Dumb).

### 4.2. Rutas y Navegación

| Ruta | Componente | Guard (Seguridad) | Modo de Carga | Notas |
| :--- | :--- | :--- | :--- | :--- |
| `/login` | `LoginComponent` | `NoAuthGuard` | Eager | Pantalla de inicio de sesión con Google. |
| `/waiter` | `WaiterDashboardComponent` | `AuthGuard` (Rol: Waiter) | Lazy | Pantalla principal para toma de pedidos del mesero. |
| `/waiter/orders` | `WaiterOrdersComponent` | `AuthGuard` (Rol: Waiter) | Lazy | Monitoreo del estado de pedidos del mesero actual. |
| `/barista` | `BaristaDashboardComponent` | `AuthGuard` (Rol: Barista) | Lazy | Cola de comandas de la barra. |
| `/admin` | `AdminDashboardComponent` | `AuthGuard` (Rol: Admin) | Lazy | Panel de control de productos, usuarios y consolidados. |
| `**` | Redirección `/login` | - | - | Fallback global. |

### 4.3. Modelos de Datos Principales (Interfaces clave)

> Refleja el código real en `src/app/core/models/`. El modelo **objetivo** del cambio descrito en `docs/cambio-en-modelo-de-datos.md` está en la §13 de este documento, todavía sin implementar.

```typescript
// src/app/core/models/user.model.ts
export type UserRole = 'admin' | 'waiter' | 'barista' | 'inactive';

export interface AppUser {
  email: string;            // el documento de Firestore usa el email como ID, no el UID
  displayName: string;
  role: UserRole;
  createdAt: Timestamp;
}

// src/app/core/models/product.model.ts
export type ProductCategory =
  | 'bebidas' | 'cocteles' | 'licores' | 'cervezas' | 'comida' | 'reposteria' | 'ofertas';

export type ProductSubcategory =
  | 'de_cafe' | 'calientes' | 'frias'          // bebidas
  | 'clasicos' | 'de_autor' | 'premium'        // cocteles
  | 'trago' | 'botella'                        // licores
  | 'nacionales' | 'importadas' | 'artesanales'// cervezas
  | 'combos' | 'promociones';                  // ofertas

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  subcategory?: ProductSubcategory | null;  // null explícito para comida y repostería
  basePrice: number;       // PVP sin propina
  tipAmount: number;       // valor absoluto de propina fija por unidad
  totalPrice: number;      // basePrice + tipAmount (precio visual en carta)
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// src/app/core/models/order-item.model.ts
export type ItemStatus = 'pending' | 'ready';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;   // = product.totalPrice (base + propina), NO el precio base
  tipAmount: number;   // propina por unidad, denormalizada del producto
  itemStatus: ItemStatus;
}

// src/app/core/models/order.model.ts
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type PaymentMethod = 'card' | 'cash' | 'nequi' | 'daviplata';

export interface Order {
  id: string;
  tableNumber: string;      // identificador libre del pedido: "Mesa 3", "Juan"
  items: OrderItem[];
  status: OrderStatus;
  paid: boolean;
  paymentMethod: PaymentMethod | null;
  paidAt: Timestamp | null;
  waiterId: string;         // email, no UID
  waiterName: string;
  total: number;            // Σ unitPrice × quantity (propina ya incluida)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Discriminación contable:** la propina no se almacena agregada en el pedido. Se re-deriva por resta a partir de los ítems (`base = Σ (unitPrice − tipAmount) × qty`, `propina = Σ tipAmount × qty`) en la vista del mesero y en el consolidado del administrador.

**Deriva conocida del modelo:** `updateOrderStatusAsBarista()` escribe `baristaId` y `preparedAt` en el documento del pedido, pero ninguno de los dos está declarado en la interfaz `Order`. Queda corregido en la §13.

**Fuente única de verdad de categorías:** `src/app/core/models/category-tree.ts` (`CATEGORY_TREE`) alimenta el tipo de TypeScript, el filtro de la interfaz, los selects en cascada del formulario y la validación del import de Excel. La misma jerarquía está duplicada en `firestore.rules` (`productSubcategoriesFor()`), que es la única validación real del lado servidor.

### 4.4. Sistema de Estilos y Temas
- **Tematización con Ionic:** El proyecto utiliza variables CSS configuradas en `src/theme/variables.css` para manejar colores institucionales (paleta elegante y oscura de Le Tiende, adecuada para ambientes de teatro/bar).
- **Tailwind CSS v4:** Utilizado para espaciados, layouts rápidos (`flex`, `grid`) y tipografías móviles sin sobreescribir los estilos de interacción nativos de Ionic.

---

## 5. Backend y APIs

Dado que se utiliza **Firebase**, no se cuenta con un servidor Node.js/Express tradicional. En su lugar, el cliente interactúa directamente con **Cloud Firestore** utilizando reglas de seguridad estrictas como cortafuegos.

### Estructura de Colecciones de Cloud Firestore

Tres colecciones planas, sin subcolecciones. Refleja el estado real de la base de datos.

| Colección | ID del documento | Estructura |
| :--- | :--- | :--- |
| `users` | el **email** del usuario | `{ email, displayName, role: 'admin'\|'waiter'\|'barista'\|'inactive', createdAt }` |
| `products` | autogenerado | `{ name, category, subcategory?, basePrice, tipAmount, totalPrice, isActive, createdAt, updatedAt }` |
| `orders` | autogenerado | `{ tableNumber, items: OrderItem[], status, paid, paymentMethod, paidAt, waiterId, waiterName, total, baristaId?, preparedAt?, createdAt, updatedAt }` |

**El ID de `users` es el email, no el UID de Firebase Auth.** `firestore.rules` resuelve el rol con `get(/databases/$(database)/documents/users/$(request.auth.token.email))`, así que cambiar esa clave rompería toda la autorización.

Índices compuestos declarados en `firestore.indexes.json` (solo para `orders`, que es la única colección consultada con filtro + orden).

### Servicios Externos Utilizados
- **Firebase Auth:** Gestión de sesión de Google.
- **Cloud Firestore:** Persistencia y sincronización reactiva de comandas.
- **Firebase Hosting:** Distribución global de la aplicación y CDN del endpoint público.
- **Cloud Functions (Gen2, Node 24):** una sola función HTTPS, `publicMenu`, que sirve `GET /menu.json` (ver §12).

---

## 6. Gestión de Contenido

No aplica para esta versión. El catálogo de productos y precios es administrado directamente por el perfil de Administrador a través de formularios reactivos del módulo `/admin`.

---

## 7. Infraestructura y Despliegue

La infraestructura se provee a través de Google Cloud Platform bajo el **Plan Spark de Firebase (Capa 100% Gratuita)**. Ningún recurso debe incurrir en costos ni requerir el plan Blaze (de pago por uso).

### Ambientes de Ejecución

| Entorno | URL del Sitio | Firebase Project ID | Variables de Entorno | Comando de Despliegue |
| :--- | :--- | :--- | :--- | :--- |
| **Desarrollo** | `http://localhost:4200` | `comandante-dev` | `src/environments/environment.ts` | `npm run start` |
| **Staging** | `https://comandante-stage.web.app` | `comandante-stage` | `src/environments/environment.stage.ts`| `npm run deploy:stage`|
| **Producción**| `https://comandante.letiende.co` | `comandante-prod` | `src/environments/environment.prod.ts` | `npm run deploy:prod` |

### Configuración del Dominio Personalizado en AWS Route 53

Le Tiende gestiona el dominio `letiende.co` a través de AWS Route 53. Para enlazar el subdominio `comandante.letiende.co` a Firebase Hosting sin costo, se sigue este procedimiento:

1.  **En Firebase Console:**
    *   Ir a *Hosting* -> *Añadir dominio personalizado*.
    *   Ingresar `comandante.letiende.co`.
    *   Firebase proporcionará un valor para un registro **TXT** para validar la propiedad del dominio, y posteriormente dos direcciones IP públicas para registros **A**.
2.  **En AWS Route 53 (Consola AWS):**
    *   Ir a *Hosted Zones* (Zonas alojadas) y seleccionar `letiende.co`.
    *   **Paso 2.1 (Verificación):** Crear un nuevo registro:
        - **Record Name:** `_acme-challenge.comandante.letiende.co` (o el indicado por Firebase).
        - **Record Type:** `TXT`.
        - **Value:** `[Token de verificación de Firebase]`.
        - **TTL:** `300` segundos (para propagación rápida).
    *   **Paso 2.2 (Redirección A):** Una vez verificado el dominio por Firebase, crear un registro adicional en Route 53:
        - **Record Name:** `comandante.letiende.co`.
        - **Record Type:** `A`.
        - **Alias:** Seleccionar `No`.
        - **Value/Route traffic to:** Ingresar las dos direcciones IP provistas por Firebase Hosting (una por línea).
        - **Routing Policy:** `Simple routing`.
3.  **Certificado SSL:** Firebase Hosting aprovisionará automáticamente un certificado SSL gratuito de Let's Encrypt para `comandante.letiende.co` en un lapso de 1 a 24 horas después de la propagación del DNS.

### Directrices de Optimización para el Plan Spark (Capa Gratuita)

Para evitar superar los límites del Plan Spark (50k lecturas/día, 20k escrituras/día en Firestore), el cliente Angular implementará los siguientes patrones:

1.  **Evitar Polling y Consultas Redundantes:** Usar listeners activos (`onSnapshot`) de Firestore solo en pantallas críticas (ej. cola del barista). Desconectar (`unsubscribe`) el listener inmediatamente cuando el componente se destruya usando `takeUntilDestroyed` de Angular.
2.  **Caché Local del Catálogo:** El catálogo de productos (`/products`) se lee una sola vez al cargar la app y se almacena en una Signal de Angular. No se realizan lecturas repetidas de productos en la toma de cada pedido.
3.  **Filtrado por Jornada Activa:** Las consultas de pedidos en la vista del barista e historial del mesero se filtran estrictamente por la fecha actual (`createdAt >= inicio_del_dia`). Esto reduce exponencialmente el volumen de documentos leídos.
4.  **Agrupamiento de Datos:** El consolidado diario se calcula localmente en el navegador del administrador al finalizar la noche, haciendo una sola lectura de los pedidos de esa jornada en lugar de delegar el cálculo a base de datos o Cloud Functions costosas.

### Proceso de Despliegue Paso a Paso (CI/CD Local)
1. Ejecutar linters y validaciones estáticas: `npm run lint`.
2. Compilar la aplicación optimizada para producción: `npm run build -- --configuration=production`.
3. Iniciar despliegue de Firebase Hosting: `npx firebase deploy --only hosting`.

---

## 8. Autenticación y Seguridad

1.  **Google Sign-In:** Los usuarios inician sesión con su cuenta de Google.
2.  **Validación de Roles Dinámicos y Lista Blanca:**
    *   Al autenticarse, un guardián de Angular consulta el perfil en `/users/{uid}`.
    *   Si el correo electrónico existe en la colección y `isActive == true`, se lee su rol asignado (`role: 'admin' | 'barista' | 'waiter'`) y se le permite navegar al dashboard correspondiente.
    *   El administrador puede modificar el rol de cualquier colaborador al inicio de la jornada. Al detectar el cambio de rol en tiempo real en la base de datos, el cliente Angular redirige al usuario automáticamente a su interfaz correspondiente.
3.  **Cuenta Administradora Semilla (Seed Account):**
    *   El correo `letiende.co@gmail.com` actúa como el administrador raíz del sistema.
    *   Este usuario está pre-autorizado a nivel de base de datos para realizar la inicialización y el registro de otros usuarios, incluyendo la asignación de nuevos administradores.
4.  **Reglas de Seguridad en Cloud Firestore (Prevención de Escalación de Privilegios):**
    *   Únicamente los usuarios que posean el rol `admin` en su documento de perfil de base de datos pueden modificar la colección `/users` o crear nuevos administradores.
    *   El correo raíz `letiende.co@gmail.com` tiene permisos administrativos explícitos configurados a nivel de reglas del servidor para evitar bloqueos.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Función auxiliar para verificar si el usuario es administrador
    function isAdmin() {
      return request.auth != null && (
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' ||
        request.auth.token.email == 'letiende.co@gmail.com'
      );
    }

    // Reglas para la colección de usuarios
    match /users/{userId} {
      allow read: if request.auth != null;
      // Solo administradores pueden crear, modificar o eliminar usuarios
      allow write: if isAdmin();
    }
    
    // Reglas para productos
    match /products/{productId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }

    // Reglas para pedidos (orders)
    match /orders/{orderId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'waiter';
      allow update: if request.auth != null && (
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'barista' ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'waiter' ||
        isAdmin()
      );
      allow delete: if isAdmin();
    }
  }
}
```

---

## 9. Gestión de Secretos

Las llaves de configuración de Firebase no son consideradas secretos de alto riesgo debido a que están restringidas por dominios permitidos (CORS) y reglas de base de datos. Sin embargo, se gestionan a través de variables de entorno de Angular y no se incluyen credenciales administrativas en el código fuente.

| Variable | Propósito | Contexto de Uso |
| :--- | :--- | :--- |
| `apiKey` | Identificador de API de Firebase | Carga del SDK de Firebase en el cliente. |
| `authDomain` | Dominio de redirección OAuth | Inicio de sesión con Google. |
| `projectId` | Identificador de Proyecto | Conexión a la base de datos Firestore y Storage. |

---

## 10. Convenciones de Código y Flujo de Trabajo

- **Nombres de Componentes y Clases:** kebab-case para nombres de archivos (`waiter-dashboard.component.ts`), PascalCase para nombres de clases TypeScript (`WaiterDashboardComponent`).
- **Arquitectura Basada en Datos (Signals):** Evitar el uso excesivo de `BehaviorSubject` de RxJS a favor de `signal()`, `computed()` y `effect()` para la sincronización interna.
- **Tipado Estricto:** Prohibido el uso de `any` en TypeScript. Cada objeto de datos debe implementar su correspondiente `interface`.

---

## 11. Roadmap Técnico (Estrategia de Creación)

| Hito / Feature | Archivos a crear / modificar | Dependencias Técnicas |
| :--- | :--- | :--- |
| **Inicialización** | `package.json`, `angular.json`, `tailwind.config.js` | Angular CLI, Tailwind, Ionic CLI |
| **Config. Firebase & Auth** | `src/app/core/auth/*`, `src/app/app.config.ts` | Firebase SDK, AngularFire |
| **Toma de Pedidos (Mesero)**| `src/app/features/waiter/*`, `src/app/shared/components/*`| Ionic components, Tailwind, Signals |
| **Cola de Comandas (Barista)**| `src/app/features/barista/*` | Firestore realtime updates (`onSnapshot`) |
| **Consolidado & ABM (Admin)**| `src/app/features/admin/*` | Formularios reactivos de Angular |

---

## 12. Endpoint público `/menu.json` (integración con letiende.co)

### Propósito

El sitio web público **letiende.co** (repositorio separado, fuera de este proyecto) necesita mostrar el menú del centro cultural sin autenticación ni acceso a la colección privada `/products` (que requiere sesión y contiene desglose interno de negocio como `basePrice` y `tipAmount`).

En vez de exponer una colección de Firestore de lectura pública abierta (riesgo: queries anónimas ilimitadas contra la cuota gratuita compartida con el POS), el menú se sirve como **JSON generado on-demand por una Cloud Function HTTPS, cacheado por el CDN de Firebase Hosting**. Así, casi ninguna petición real del sitio público llega a Firestore.

### Cómo funciona

- **Endpoint:** `GET https://comandante.letiende.co/menu.json` (o el dominio de Hosting que corresponda).
- **Rewrite de Hosting** (`firebase.json`) enruta `/menu.json` hacia la Cloud Function HTTPS Gen2 `publicMenu` (`functions/src/index.ts`, región `us-central1`), definido ANTES del rewrite catch-all `**` → `/index.html`.
- La función consulta `/products` con el **Admin SDK** (`getFirestore()`, no cuenta contra la cuota del cliente) filtrando `isActive == true`, y arma el JSON de respuesta en cada invocación (no hay colección espejo ni sincronización previa).
- **Caché:** la respuesta incluye `Cache-Control: public, max-age=300, s-maxage=300` (5 minutos), por lo que el CDN de Firebase Hosting sirve la gran mayoría de las peticiones sin invocar la función ni tocar Firestore.
- **CORS:** `Access-Control-Allow-Origin: *` — es data intencionalmente pública, sin autenticación.
- **Métodos:** solo `GET`; cualquier otro método responde `405`.
- **Errores:** ante una falla de Firestore, responde `500` con un JSON de error simple.

### Formato de la respuesta

```json
{
  "updatedAt": "2026-09-15T18:30:00.000Z",
  "items": [
    {
      "name": "Cerveza Artesanal",
      "category": "cervezas",
      "subcategory": "artesanales",
      "totalPrice": 15000
    }
  ]
}
```

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `updatedAt` | `string` (ISO 8601) | Momento exacto en que se generó la respuesta. |
| `items` | `array` | Lista de productos activos. |
| `items[].name` | `string` | Nombre del producto. |
| `items[].category` | `string` | Categoría raíz (`bebidas`, `cocteles`, `licores`, `cervezas`, `comida`, `reposteria`, `ofertas`). |
| `items[].subcategory` | `string \| null` | Subcategoría, o `null` si la categoría no aplica subcategorías. |
| `items[].totalPrice` | `number` | Precio final a cobrar (ya incluye propina discriminada). |

**Campos deliberadamente excluidos:** `basePrice`, `tipAmount`, `id`, `createdAt`, `updatedAt` por ítem, o cualquier otro campo interno de `/products`.

### Consumo desde letiende.co

El sitio público debe consumir el endpoint con un `fetch` simple, sin autenticación ni credenciales:

```js
const res = await fetch('https://comandante.letiende.co/menu.json');
const { updatedAt, items } = await res.json();
```

### Permisos

No aplica ninguna regla de `firestore.rules`: el endpoint no expone una colección de Firestore, sino una función HTTPS que consulta `/products` con el Admin SDK, que ignora las reglas de seguridad del cliente. La lectura es pública y sin autenticación; el endpoint es de solo lectura y no acepta escrituras de ningún tipo.

---

## 13. Modelo de datos objetivo (Tareas 29-31 — pendiente de implementación)

> **Esta sección describe lo que todavía NO existe.** Las §4.3, §5 y §12 describen el sistema desplegado hoy. A medida que se completen las Tareas 29, 30 y 31 de `TODO.md`, cada parte de esta sección se traslada a la sección definitiva que le corresponde y esta §13 se va acortando hasta desaparecer.
>
> Origen y justificación: `docs/cambio-en-modelo-de-datos.md`.

### 13.1. Por qué cambia el modelo

El catálogo de productos de Comandante deja de ser solo el menú interno del POS y pasa a ser, simultáneamente:

1. el catálogo del punto de venta,
2. la lista de precios pública de **letiende.co** (vía `GET /menu.json`), y
3. la fuente de datos de la **carta física** de Le Tiende (vía una hoja de Google Sheets conectada a Canva).

Un precio con la propina ya embebida (`totalPrice`) sirve para el primer uso pero no para los otros dos: en una carta pública el cliente debe ver el precio del producto, no un precio inflado con una propina que legalmente es voluntaria. Por eso la propina abandona el producto y pasa al pedido, donde se calcula como un porcentaje editable.

### 13.2. Fuente de verdad del catálogo

Un documento de **Google Sheets** con dos hojas:

- **`datos`** — listado plano de productos. El administrador lo exporta como XLSX y lo carga en Comandante con el importador existente. Es lo que se persiste en `/products`.
- **`canva`** — conectada dinámicamente a [Canva](https://canva.com) para generar la carta impresa en PDF. Sus nombres y precios se obtienen de `datos` mediante fórmulas o un script. **Comandante no la lee.**

Columnas de la hoja `datos` y de la plantilla descargable:

| Columna | Tipo | Notas |
| :--- | :--- | :--- |
| `name` | texto | Obligatorio. Fila sin nombre se omite en silencio. |
| `additions` | lista separada por comas | Vacío si no aplica. Ej: `leche_vegetal, licor` |
| `variants` | lista separada por comas | Vacío si no aplica. No alteran el precio. |
| `description` | texto | Opcional. Se publica en `/menu.json`. |
| `category` | enum | Una de las 7 categorías raíz. |
| `subcategory` | enum | Obligatoria salvo en `comida` y `reposteria`. |
| `basePrice` | número | PVP sin propina. |
| `additionPrices` | lista de números | **Paralela a `additions`**: misma cantidad de elementos. |
| `active` | booleano | Se mapea al campo `isActive` del producto. |

Desaparece la columna `tipAmount`. El importador conserva su comportamiento de *upsert*: crea y actualiza, pero no archiva los productos que ya no aparezcan en la hoja.

### 13.3. Interfaces objetivo

```typescript
// src/app/core/models/product.model.ts
export interface ProductAddition {
  addition: string;        // 'leche_vegetal'
  additionPrice: number;   // 3500
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  category: ProductCategory;
  subcategory?: ProductSubcategory | null;
  variants: string[];              // [] si no aplica
  additions: ProductAddition[];    // [] si no aplica
  basePrice: number;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
// Eliminados respecto a la §4.3: tipAmount, totalPrice

// src/app/core/models/order-item.model.ts
export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  variant: string | null;          // obligatorio si el producto tiene variants
  additions: ProductAddition[];    // las seleccionadas, con su precio
  unitPrice: number;               // basePrice + Σ additionPrice
  itemStatus: ItemStatus;
}
// Eliminado respecto a la §4.3: tipAmount

// src/app/core/models/order.model.ts
export type PaymentMethod = 'datafono' | 'qr' | 'efectivo';

export interface Order {
  // …campos actuales de la §4.3…
  observations: string;      // '' si el mesero no escribió nada
  subtotal: number;          // Σ unitPrice × quantity
  tipPercentage: number;     // 10 por defecto
  tipValue: number;          // 0 por defecto (valor absoluto)
  tipAmount: number;         // Math.round(subtotal × tipPercentage / 100) + tipValue
  total: number;             // subtotal + tipAmount
  baristaId: string | null;  // se declara: hoy se escribe sin estar en la interfaz
  preparedAt: Timestamp | null;
}
```

El peso colombiano no maneja centavos: la propina porcentual se redondea con `Math.round` **antes** de sumarle `tipValue`.

La propina deja de re-derivarse por resta sobre los ítems (§4.3): se lee directamente de `order.subtotal` y `order.tipAmount`, tanto en la vista del mesero como en el consolidado del administrador.

### 13.4. Medios de pago

`card | cash | nequi | daviplata` se reemplaza por:

| Valor | Etiqueta | Nota |
| :--- | :--- | :--- |
| `datafono` | Datáfono | Terminal físico. Requiere discriminar consumo y propina al digitar. |
| `qr` | QR | **SonoQR de Bold**, adquirido por Le Tiende. Agrupa billeteras virtuales (Nequi, Daviplata, etc.) y transferencias electrónicas en un solo medio. |
| `efectivo` | Efectivo | |

La lista vive en un archivo nuevo, `src/app/core/models/payment-methods.ts`, como fuente única de verdad, siguiendo el patrón ya establecido por `category-tree.ts`. Hoy está duplicada y hardcodeada en `waiter.component.ts` (action sheet de cobro) y en `admin-reports.component.ts` (etiqueta y color del badge).

`firestore.rules` no valida el valor de `paymentMethod`, así que este cambio no requiere tocar las reglas.

### 13.5. Reglas de seguridad

El mesero necesita poder corregir la propina de un pedido ya enviado a la barra, mientras no esté cobrado. Helper nuevo en `firestore.rules`:

```javascript
function onlyUpdatesTip() {
  let allowed = ['tipPercentage', 'tipValue', 'tipAmount', 'total', 'updatedAt'];
  return request.resource.data.diff(resource.data).affectedKeys().hasOnly(allowed)
      && resource.data.paid == false;
}
```

Se suma a las cláusulas existentes de `/orders/{orderId}`:

```javascript
allow update: if isAdmin()
    || (isBarista() && onlyUpdatesOrderStatus())
    || (isWaiter() && (onlyMarksDelivered() || onlyMarksPaid() || onlyUpdatesTip()));
```

El mesero sigue **sin** poder modificar los ítems de un pedido enviado, ni tocar un pedido ya cobrado.

Adicionalmente, `isValidProductData()` amplía su validación (hoy solo comprueba `category`/`subcategory`) para exigir que `basePrice` sea un número no negativo y que `variants` y `additions` sean listas.

### 13.6. Nuevo contrato de `GET /menu.json`

Reemplaza sin compatibilidad hacia atrás al de la §12. En el momento de escribir esto **letiende.co todavía no consume el endpoint**, así que no se conserva ningún campo del contrato anterior.

```json
{
  "updatedAt": "2026-09-19T23:45:24.778Z",
  "items": [
    {
      "name": "Capuchino",
      "description": null,
      "additions": [
        { "addition": "leche_vegetal", "additionPrice": 3500 },
        { "addition": "licor", "additionPrice": 8700 }
      ],
      "variants": [],
      "category": "bebidas",
      "subcategory": "de_cafe",
      "basePrice": 9900
    }
  ]
}
```

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `updatedAt` | `string` (ISO 8601) | Momento en que se generó la respuesta. |
| `items[].name` | `string` | Nombre del producto. |
| `items[].description` | `string \| null` | Descripción para la carta digital. |
| `items[].additions` | `{ addition, additionPrice }[]` | Adiciones disponibles y su costo. `[]` si no aplica. |
| `items[].variants` | `string[]` | Variantes disponibles. No alteran el precio. `[]` si no aplica. |
| `items[].category` | `string` | Categoría raíz. |
| `items[].subcategory` | `string \| null` | `null` si la categoría no admite subcategorías. |
| `items[].basePrice` | `number` | Precio del producto, **sin propina**. |

**Campos excluidos deliberadamente:** `id`, `isActive`, `createdAt`, `updatedAt` por ítem. Se mantienen sin cambio el filtro `isActive == true`, el `Cache-Control: public, max-age=300, s-maxage=300`, el `Access-Control-Allow-Origin: *`, el `405` en métodos distintos de `GET` y el `500` ante fallo de Firestore.

**Cambio de semántica importante para el consumidor:** el contrato anterior entregaba `totalPrice` (precio con la propina ya incluida). El nuevo entrega `basePrice` (precio sin propina). Para un mismo producto, el número que llega es más bajo, no es el mismo dato con otro nombre.
