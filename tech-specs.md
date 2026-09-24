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
│   │   │   ├── db/               # order/product/user.service.ts + live-listener.ts, resilient-listener.ts, realtime-status.service.ts (listeners de tiempo real resilientes)
│   │   │   ├── models/           # Interfaces + category-tree.ts (fuente única de categorías) + order-status.ts (etiquetas, colores y "entregado sin cobrar")
│   │   │   ├── ui/               # connection-banner.component.ts (aviso global de conexión)
│   │   │   └── utils/            # normalize-text.ts: comparación sin tildes/diéresis/ñ para búsquedas
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

> Refleja el código real en `src/app/core/models/`. El modelo de producto/pedido con variantes, adiciones y propina a nivel de pedido se implementó en la Tarea 29 (2026-09-20); la Tarea 30 (2026-09-21) no cambia estos modelos, solo conecta la UI que faltaba. La Tarea 31 (2026-09-21) reemplaza `PaymentMethod` y hace la propina editable después de enviar el pedido (`updateOrderTip()`). Lo que sigue pendiente de la Tarea 33 está en la §13.

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

// Adición opcional de un producto (ej. "leche vegetal" en un capuchino):
// suma su propio precio al `basePrice` cuando el mesero la selecciona.
export interface ProductAddition {
  addition: string;
  additionPrice: number;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;               // carta impresa y carta digital de letiende.co
  category: ProductCategory;
  subcategory?: ProductSubcategory | null;   // null explícito para comida y repostería
  variants: string[];                        // opciones excluyentes, NO alteran el precio; [] si no aplica
  additions: ProductAddition[];              // extras opcionales que SÍ suman al precio; [] si no aplica
  basePrice: number;                         // PVP sin propina — la propina ya no vive en el producto
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
  variant: string | null;          // obligatorio (no null) si Product.variants no está vacío
  additions: ProductAddition[];    // las seleccionadas, con su precio ya denormalizado
  unitPrice: number;                // basePrice + Σ additionPrice — sin propina
  itemStatus: ItemStatus;
}

// src/app/core/models/order.model.ts
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type PaymentMethod = 'datafono' | 'qr' | 'efectivo';

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
  observations: string;     // dirigidas al barista; '' si no se escribió ninguna
  subtotal: number;         // Σ unitPrice × quantity, SIN propina
  tipPercentage: number;    // sugerido sobre el subtotal, 10 por defecto
  tipValue: number;         // valor absoluto adicional, 0 por defecto
  tipAmount: number;        // Math.round(subtotal × tipPercentage / 100) + tipValue
  total: number;            // subtotal + tipAmount — el valor a cobrar
  baristaId: string | null;
  preparedAt: Timestamp | null;
  deliveredAt?: Timestamp | null; // al pasar a 'delivered' (Tarea 37); ausente en pedidos anteriores
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Cálculo de propina:** `src/app/core/models/order-totals.ts` exporta `computeOrderTotals(subtotal, tipPercentage, tipValue)`, una función pura compartida por `OrderService.createOrder()`, `OrderService.updateOrderTip()` y el resumen del mesero — el número que se ve antes de enviar el pedido es exactamente el que queda guardado, y el mismo cálculo se reutiliza al editar la propina de un pedido ya creado (Tarea 31, 2026-09-21). El peso colombiano no maneja centavos: la propina porcentual se redondea con `Math.round` **antes** de sumarle `tipValue`. `OrderService.createOrder()` acepta `tipPercentage`/`tipValue` opcionales (10/0 por defecto); `OrderService.updateOrderTip(orderId, { tipPercentage, tipValue, tipAmount, total })` persiste una edición posterior, autorizada por el helper `onlyUpdatesTip()` de `firestore.rules` mientras `paid == false`.

**Discriminación contable:** ya no se re-deriva por resta sobre los ítems. El consolidado del administrador y la vista del mesero leen `order.subtotal` y `order.tipAmount` directamente.

**Fuente única de verdad de medios de pago:** `src/app/core/models/payment-methods.ts` (`PAYMENT_METHODS`) alimenta el action sheet de cobro del mesero y las etiquetas/colores del consolidado del administrador, siguiendo el mismo patrón que `category-tree.ts`.

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
| `products` | autogenerado | `{ name, description, category, subcategory?, variants, additions, basePrice, isActive, createdAt, updatedAt }` |
| `orders` | autogenerado | `{ tableNumber, items: OrderItem[], status, paid, paymentMethod, paidAt, waiterId, waiterName, observations, subtotal, tipPercentage, tipValue, tipAmount, total, baristaId, preparedAt, deliveredAt, createdAt, updatedAt }` |

**El ID de `users` es el email, no el UID de Firebase Auth.** `firestore.rules` resuelve el rol con `get(/databases/$(database)/documents/users/$(request.auth.token.email))`, así que cambiar esa clave rompería toda la autorización.

Índices compuestos declarados en `firestore.indexes.json` (solo para `orders`, que es la única colección consultada con filtro + orden). **El CI no despliega índices** (solo `firestore:rules,functions`): una consulta nueva debe poder resolverse con índices de campo único (igualdades múltiples, o un solo rango + `orderBy` sobre ese mismo campo), como las de la Tarea 37.

**Qué es un pedido "activo" (Tarea 37).** `OrderService.activeOrders` une dos listeners: los pedidos `pending`/`preparing`/`ready` y los `delivered` con `paid == false` — un pedido entregado pero sin cobrar sigue activo hasta que se cobre. La pestaña *Entregados* del administrador suma un tercer listener (`watchRecentDelivered()`, `deliveredAt >= ahora − 24 h`) que solo vive mientras esa pestaña está abierta.

### Servicios Externos Utilizados
- **Firebase Auth:** Gestión de sesión de Google.
- **Cloud Firestore:** Persistencia y sincronización reactiva de comandas.
- **Firebase Hosting:** Distribución global de la aplicación y CDN del endpoint público.
- **Cloud Functions (Gen2, Node 24):** una sola función HTTPS, `publicMenu`, que sirve `GET /menu.json` (ver §12).

---

## 6. Gestión de Contenido

El catálogo de productos se administra desde `/admin/products`, con formularios reactivos, y también se carga en bloque desde un documento externo de **Google Sheets** (Tarea 29, 2026-09-20) que es la fuente de verdad compartida entre tres destinos: el punto de venta, la lista de precios pública de letiende.co (`/menu.json`, §12) y la carta impresa.

El documento de Google Sheets tiene dos hojas:

- **`datos`** — listado plano de productos. El administrador lo exporta como XLSX y lo carga en Comandante (botón "Cargar Excel" en `/admin/products`). Es lo que se persiste en `/products`.
- **`canva`** — conectada dinámicamente a [Canva](https://canva.com) para generar la carta impresa en PDF. Sus nombres y precios se obtienen de `datos` mediante fórmulas o un script. **Comandante no la lee.**

Columnas de la hoja `datos` y de la plantilla descargable (`descargar plantilla`, `src/app/features/admin/products/products.component.ts`):

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

El parseo y la validación de estas columnas viven en `src/app/features/admin/products/import-parsers.ts` (funciones puras, con pruebas en `import-parsers.spec.ts`): rechazan la importación completa del archivo si `additionPrices` no tiene la misma cantidad de elementos que `additions`, si algún precio no es finito o es negativo, si hay variantes o adiciones duplicadas en una fila, o si `active` no es interpretable como booleano — nada se escribe hasta que todas las filas son válidas.

**El importador es *upsert*, no sincronización total:** crea productos nuevos y actualiza los existentes (por la clave `nombre+categoría+subcategoría`), pero **no archiva** los que dejen de aparecer en la hoja. Decisión explícita (ver `docs/cambio-en-modelo-de-datos.md`, sección "Decisiones tomadas"): para retirar un producto hay que archivarlo desde Comandante o recargar el catálogo completo tras un borrado masivo.

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

El sitio web público **letiende.co** (repositorio separado, fuera de este proyecto) necesita mostrar el menú del centro cultural sin autenticación ni acceso a la colección privada `/products` (que requiere sesión).

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
  "updatedAt": "2026-09-20T18:30:00.000Z",
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
| `updatedAt` | `string` (ISO 8601) | Momento exacto en que se generó la respuesta. |
| `items` | `array` | Lista de productos activos. |
| `items[].name` | `string` | Nombre del producto. |
| `items[].description` | `string \| null` | Descripción para la carta digital. |
| `items[].additions` | `{ addition, additionPrice }[]` | Adiciones disponibles y su costo. `[]` si no aplica. |
| `items[].variants` | `string[]` | Variantes disponibles. No alteran el precio. `[]` si no aplica. |
| `items[].category` | `string` | Categoría raíz (`bebidas`, `cocteles`, `licores`, `cervezas`, `comida`, `reposteria`, `ofertas`). |
| `items[].subcategory` | `string \| null` | Subcategoría, o `null` si la categoría no aplica subcategorías. |
| `items[].basePrice` | `number` | Precio del producto, **sin propina** (desde la Tarea 29 la propina vive en el pedido, no en el producto). |

**Campos deliberadamente excluidos:** `id`, `isActive`, `createdAt`, `updatedAt` por ítem, o cualquier otro campo interno de `/products`.

> **Cambio de contrato (Tarea 29, 2026-09-20):** el formato anterior entregaba `totalPrice` (precio con la propina ya incluida). Este formato entrega `basePrice` (sin propina) y suma `description`, `additions` y `variants`. Se rompió sin capa de compatibilidad porque letiende.co todavía no consumía el endpoint en ese momento.

### Consumo desde letiende.co

El sitio público debe consumir el endpoint con un `fetch` simple, sin autenticación ni credenciales:

```js
const res = await fetch('https://comandante.letiende.co/menu.json');
const { updatedAt, items } = await res.json();
```

### Permisos

No aplica ninguna regla de `firestore.rules`: el endpoint no expone una colección de Firestore, sino una función HTTPS que consulta `/products` con el Admin SDK, que ignora las reglas de seguridad del cliente. La lectura es pública y sin autenticación; el endpoint es de solo lectura y no acepta escrituras de ningún tipo.

---

## 13. Cambios pendientes (ninguno)

> Sección histórica: describía el cambio de modelo de datos de `docs/cambio-en-modelo-de-datos.md` mientras estaba pendiente. Las tres tareas que cubría (29, 30 y 31) y su prueba asociada (33) ya están implementadas — variantes/adiciones/propina a nivel de pedido en §4.3/§5/§6/§12; selección de variante/adición y observaciones en `waiter.component.ts`/`barista.component.ts`/`admin-orders.component.ts`; medios de pago y propina editable en `payment-methods.ts`/`OrderService.updateOrderTip()`/`onlyUpdatesTip()`; la matriz de pruebas de `firestore.rules` en `firestore.rules.spec.ts` (§14). Detalle completo de cada una en `TODO.md` §3. Se conserva el número de esta sección para no romper las referencias cruzadas de otros documentos; queda vacía hasta que un cambio nuevo la ocupe.

## 14. Estrategia de Pruebas

### Situación de partida (2026-09-19)

| Hecho | Detalle |
| :--- | :--- |
| Pruebas existentes | **Una**: `src/app/app.component.spec.ts` (`should create the app`). |
| Runner | Vitest, vía el builder `@angular/build:unit-test` con `runnerConfig: vitest.config.ts`. |
| Comando | `npm test` (`ng test`). |
| Ejecución en CI | **Ninguna.** `.github/workflows/deploy-hosting.yml` hace `npm ci` → build → deploy en ambos jobs, sin ejecutar la suite. |
| Lint | No existe script de lint en el repositorio. |

⚠️ **El builder activa el modo *watch* por defecto solo en TTY** (`"Defaults to \`true\` in TTY environments and \`false\` otherwise"`). En CI no hay TTY, así que `npm test` termina solo; en una terminal local, no. Usar siempre **`npm test -- --watch=false`** en scripts y documentación.

⚠️ **Vitest necesita el alias de `vitest.config.ts`.** `@ionic/angular@8.8.8` importa `@ionic/core/components` como *directory import*, que Node ESM nativo no resuelve. Está corregido con `patch-package` (carpeta `patches/`, aplicado en `postinstall`) más el alias del runner. No eliminar ninguno de los dos (ver `CLAUDE.md` §7 y `TODO.md` Tarea 21).

### Decisión: cobertura por capas, no cobertura total

No se persigue una suite completa. El análisis de costo (ADR-008 en `MEMORY.md`) estimó **20-25 sesiones supervisadas** para cubrir toda la aplicación, más un impuesto permanente de mantenimiento sobre cada cambio de interfaz — desproporcionado para una aplicación de ~3.800 líneas mantenida por una sola persona.

El criterio es cubrir **lo que puede causar daño real**: aritmética de dinero equivocada, una importación que corrompa el catálogo, y un hueco en las reglas de seguridad. Ninguna de las tres necesita pruebas de componentes.

| Capa | Costo | Qué protege | Fragilidad | Decisión |
| :--- | :--- | :--- | :--- | :--- |
| **0. Gate de CI** | ~15 min | Que las pruebas signifiquen algo | Nula | ✅ **Hecho** — Tarea 32, PR #40 |
| **1. Funciones puras** | ~1 sesión | Propina, parseo del catálogo, categorías | Nula | ✅ Dentro de las Tareas 29 y 31 |
| **2. `firestore.rules`** | ~1-2 sesiones | La única frontera de seguridad real | Muy baja | ✅ **Hecho** — Tarea 33, PR #45 |
| **3. Servicios de Firestore** | ~1-2 sesiones | Queries, lotes, transiciones de estado | Media | 🟡 Opcional, sin encolar |
| **4. Componentes** | ~8-12 sesiones | Poco, en la práctica | Alta | ❌ Descartada |
| **5. E2E (Playwright)** | ~5-7 sesiones | El camino del dinero completo | Media-alta | 🟡 Diferida, acotada a un flujo |

### Por qué se descarta la capa de componentes

`waiter.component.ts` (653 líneas) y `products.component.ts` (820) mezclan plantilla en línea, lógica de negocio, acceso a Firestore y *overlays* de Ionic en un solo archivo. Probarlos de forma significativa exige **partirlos primero**, y cada archivo de prueba necesita `TestBed`, providers de Ionic y dobles de `ActionSheetController`, `AlertController` y `ToastController`. El resultado típico son pruebas que afirman marcado y se rompen al mover un `div`.

Si el objetivo es que esos dos componentes sean más mantenibles, **partirlos aporta más valor que probarlos como están**. Ese trabajo, si se hace, es un refactor con su propia justificación, no una tarea de pruebas.

### Qué se prueba, concretamente

**Capa 1 — funciones puras** (se extraen como parte de las Tareas 29 y 31, no como trabajo aparte; el costo marginal es casi nulo porque la extracción hay que hacerla de todos modos):

- `features/admin/products/import-parsers.ts` — `parseList()`, `parsePriceList()`, `parseBoolean()`, `buildAdditions()`. Casos: listas vacías y con espacios sobrantes, `additionPrices` con distinta cantidad de elementos que `additions`, precios no finitos o negativos, entradas duplicadas en una misma fila, y las distintas formas de `active` que produce Excel (booleano nativo, `"TRUE"`, `"true"`, `1`).
- `computeOrderTotals(items, tipPercentage, tipValue)` — 10 % por defecto, redondeo a pesos sin centavos, porcentaje 0, valor absoluto solo, y ambos combinados.
- `core/models/category-tree.ts` — ya es puro hoy: `isValidCategory()`, `isValidSubcategory()`, `categoryRequiresSubcategory()`, `getCategoryNode()`.

**Capa 2 — reglas de seguridad** (Tarea 33, ✅ implementada): `firestore.rules.spec.ts`, 52 casos con `@firebase/rules-unit-testing` contra el emulador real, matriz de rol × colección × operación. Corre solo en CI (`.github/workflows/deploy-hosting.yml`, ambos jobs) — decisión explícita del dueño del proyecto de no instalar Java localmente. Detalle en `TODO.md` §3.

### Momento de ejecución (histórico)

El orden importaba porque las Tareas 29-31 reescribían justo la lógica de precios, propina e importación: escribir pruebas contra el código de entonces habría sido escribirlas contra código por desaparecer. Las cuatro etapas ya están completadas:

1. ~~**Antes de la Tarea 29** — Tarea 32 (gate de CI).~~ **Hecha** (2026-09-20, PR #40). Sin esto, todo lo demás habría sido decorativo.
2. ~~**Dentro de las Tareas 29 y 31** — capa 1, contra la forma nueva del código.~~ **Hecha.**
3. ~~**Después de la Tarea 31** — Tarea 33, cuando las reglas ya incluyeran `onlyUpdatesTip()`.~~ **Hecha** (2026-09-21, PR #45).
