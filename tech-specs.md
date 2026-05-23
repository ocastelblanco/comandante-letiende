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

El proyecto sigue la estructura estándar de una aplicación Angular modular basada en componentes Standalone:

```
comandante/
├── docs/                         # Documentación del proyecto
│   └── instrucciones-inicio.md
├── src/
│   ├── app/
│   │   ├── core/                 # Guardias, interceptores, servicios globales, constantes
│   │   │   ├── auth/             # Lógica de inicio de sesión y guardias de rol
│   │   │   ├── db/               # Cliente Firestore y persistencia
│   │   │   └── models/           # Interfaces de datos TypeScript (Order, Product, etc.)
│   │   ├── features/             # Módulos de funcionalidad por perfil de usuario
│   │   │   ├── admin/            # Vistas y componentes del Administrador
│   │   │   ├── barista/          # Vistas y componentes del Barista
│   │   │   └── waiter/           # Vistas y componentes del Mesero
│   │   ├── shared/               # Componentes, pipes y directivas comunes y reutilizables
│   │   ├── app.config.ts         # Configuración del bootstrap de Angular (Providers)
│   │   ├── app.routes.ts         # Definición de rutas y cargadores diferidos
│   │   └── app.component.ts      # Componente raíz
│   ├── assets/                   # Recursos estáticos (imágenes, fuentes, iconos)
│   ├── theme/                    # Variables globales de estilos e integración Ionic
│   ├── index.html
│   └── main.ts
├── CLAUDE.md                     # Configuración de IA, seguridad y Git Flow
├── PRD.md                        # Requerimientos de producto
├── MEMORY.md                     # Memoria de arquitectura del proyecto
├── TODO.md                       # Planificación JIT
├── angular.json
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

### Tabla de Alias de Rutas (Path Aliases)
Para evitar rutas relativas complejas como `../../../core`, se configuran en `tsconfig.json`:
- `@core/*` -> `src/app/core/*`
- `@shared/*` -> `src/app/shared/*`
- `@features/*` -> `src/app/features/*`
- `@theme/*` -> `src/theme/*`

---

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

```typescript
// @core/models/user.model.ts
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'barista' | 'waiter';
  isActive: boolean;
  createdAt: any;
}

// @core/models/product.model.ts
export interface Product {
  id: string;
  name: string;
  category: 'bebidas' | 'licores' | 'comida' | 'otros';
  basePrice: number;       // PVP sin propina
  tipValue: number;        // Valor absoluto de propina fija
  totalPrice: number;      // basePrice + tipValue (precio visual en carta)
  isAvailable: boolean;
}

// @core/models/order.model.ts
export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  basePrice: number;
  tipValue: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  waiterId: string;
  waiterName: string;
  customerName: string;     // Palabra clave / Nombre del cliente para identificación
  items: OrderItem[];
  paymentMethod?: 'cash' | 'card'; // Opcional hasta que se realiza el pago
  paymentStatus: 'pending' | 'paid'; // Estado del pago del pedido
  // Discriminación contable para datáfono
  totalConsumption: number; // Suma de (basePrice * qty)
  totalTip: number;         // Suma de (tipValue * qty)
  totalAmount: number;      // totalConsumption + totalTip
  status: 'pending' | 'preparing' | 'ready' | 'delivered';
  createdAt: any;           // Timestamp de Firebase
  updatedAt: any;
}
```

### 4.4. Sistema de Estilos y Temas
- **Tematización con Ionic:** El proyecto utiliza variables CSS configuradas en `src/theme/variables.css` para manejar colores institucionales (paleta elegante y oscura de Le Tiende, adecuada para ambientes de teatro/bar).
- **Tailwind CSS v4:** Utilizado para espaciados, layouts rápidos (`flex`, `grid`) y tipografías móviles sin sobreescribir los estilos de interacción nativos de Ionic.

---

## 5. Backend y APIs

Dado que se utiliza **Firebase**, no se cuenta con un servidor Node.js/Express tradicional. En su lugar, el cliente interactúa directamente con **Cloud Firestore** utilizando reglas de seguridad estrictas como cortafuegos.

### Estructura de Colecciones de Cloud Firestore

```
+---------------------------------------------------------------------------------+
| COLEC.  | ID DOC. | ESTRUCTURA DEL DOCUMENTO                                    |
+---------+---------+-------------------------------------------------------------+
| users   | uid     | { email, displayName, role: 'waiter'|'barista'|'admin',     |
|         |         |   isActive, createdAt }                                     |
+---------+---------+-------------------------------------------------------------+
| products| prod_id | { name, category, basePrice, tipValue, totalPrice,          |
|         |         |   isAvailable }                                             |
+---------+---------+-------------------------------------------------------------+
| orders  | order_id| { waiterId, waiterName, customerName, items: [...],         |
|         |         |   paymentMethod?, paymentStatus: 'pending'|'paid',          |
|         |         |   totalConsumption, totalTip, totalAmount, status,          |
|         |         |   createdAt, updatedAt }                                    |
+---------------------------------------------------------------------------------+
```

### Servicios Externos Utilizados
- **Firebase Auth:** Gestión de sesión de Google.
- **Cloud Firestore:** Persistencia y sincronización reactiva de comandas.
- **Firebase Hosting:** Distribución global de la aplicación.

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
