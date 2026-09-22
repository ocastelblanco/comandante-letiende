# MEMORY.md — Memoria de Arquitectura y Estado de Comandante

Este documento mantiene el registro histórico del estado de desarrollo del proyecto, decisiones de arquitectura clave (ADRs) y configuraciones técnicas del sistema **Comandante**.

---

## 1. Estado Actual del Proyecto

| Parámetro | Detalle |
| :--- | :--- |
| **Estado** | En producción. El catálogo de productos ya tiene datos reales completos (recargado por el usuario en la Tarea 29, 2026-09-20, con el modelo nuevo de variantes/adiciones); los pedidos en Firestore siguen siendo de prueba — la operación real del punto de venta aún no se ha estrenado. |
| **Producción** | `https://comandante.letiende.co` (Firebase Hosting, proyecto `comandante-letiende`). |
| **Staging** | `.firebaserc` declara `staging` y `production`, pero **ambos apuntan al mismo proyecto Firebase**. No hay un entorno de staging real aislado — el canal de preview de cada PR comparte el mismo Firestore que producción. |
| **Ramas** | `main` (producción, protegida, solo recibe merges vía PR aprobado por un humano). Las ramas `feature/*`, `fix/*`, `docs/*`, `refactor/*` y `hotfix/*` se crean desde `main`. **No existe la rama `develop`.** |
| **Tareas completadas** | 34 (ver `TODO.md` §3). Cola de tareas vacía — próxima a evaluar contra `PRD.md`. |
| **CI/CD** | `.github/workflows/deploy-hosting.yml` — push a `main` despliega Hosting, reglas de Firestore y Cloud Functions. **Los PR reciben un canal de vista previa que solo despliega Hosting — nunca `firestore.rules`** (ver gotcha en §7): un cambio de reglas no se puede verificar de punta a punta en preview, solo tras fusionar (mitigado desde la Tarea 33 con pruebas de reglas contra el emulador real, corriendo solo en CI). Desde la Tarea 32 **ambos jobs ejecutan `npm test -- --watch=false` antes del build**, y desde la Tarea 33 también `firestore.rules.spec.ts` vía `firebase emulators:exec` (con `actions/setup-java@v5`, Temurin): una suite en rojo bloquea el merge. |
| **Última Sesión** | 2026-09-21 — Confirmado en producción que la edición de propina de un pedido ya creado (Tarea 31) funciona correctamente. Tarea 33 (pruebas de `firestore.rules` con el emulador, PR #45) implementada y fusionada — cierra el ciclo completo. |

---

## 2. Funcionalidades Completadas vs. Pendientes

### Documentación y Planeación
- `[x]` Definición de Requerimientos de Producto (`PRD.md`)
- `[x]` Diseño de Especificaciones Técnicas (`tech-specs.md`)
- `[x]` Políticas de Seguridad OWASP y Git Flow (`CLAUDE.md`)
- `[x]` Sistema de diseño (`DESIGN.md`)
- `[x]` Memoria de Arquitectura (`MEMORY.md`)
- `[x]` Licencia Apache 2.0

### Infraestructura y Base
- `[x]` Proyecto en la consola de Firebase (`comandante-letiende`).
- `[x]` Repositorio y estructura Angular 21.2.x con componentes Standalone.
- `[x]` Tailwind CSS v4 e Ionic Framework 8.x integrados.
- `[x]` Reglas de Seguridad en Cloud Firestore (`firestore.rules`), con validación de categorías del lado servidor.
- `[x]` Dominio `comandante.letiende.co` apuntado desde AWS Route 53.
- `[x]` CI/CD en GitHub Actions con canal de vista previa por PR.
- `[x]` Migración completa a Node.js 24 (Cloud Functions y runners de CI).

### Módulo del Mesero (Vista Móvil)
- `[x]` Autenticación con Google Sign-In e integración con lista blanca.
- `[x]` Campo para ingresar palabra clave / nombre del cliente en cada pedido.
- `[x]` Selector ágil de productos con cálculo contable automático (Consumo vs Propina).
- `[x]` Envío inmediato de comandas a la barra para inicio de preparación antes del pago.
- `[x]` Vista de cobro posterior y registro de pago con discriminación.
- `[x]` Listado en tiempo real de estados de pedidos y estado de pago, con alerta al quedar listo.
- `[x]` Propina del 10 % calculada a nivel de pedido, a partir del subtotal *(Tarea 29)*.
- `[x]` Selección de variantes y adiciones al añadir un producto *(Tarea 30, PR #43, 2026-09-21)*.
- `[x]` Observaciones del pedido dirigidas al barista *(Tarea 30, PR #43, 2026-09-21)*.
- `[x]` Propina editable por porcentaje y valor absoluto, antes y después de enviar el pedido *(Tarea 31, PR #44, 2026-09-21)*.
- `[x]` Medios de pago Datáfono / QR / Efectivo *(Tarea 31, PR #44, 2026-09-21)*.

### Módulo del Barista (Vista Barra)
- `[x]` Cola digital cronológica de comandas entrantes, en dos columnas (por preparar / en preparación).
- `[x]` Gestión de preparación y marcado de comanda lista.
- `[x]` Notificación reactiva de comanda lista hacia el mesero.
- `[x]` Visualización de variantes, adiciones y observaciones en la comanda *(Tarea 30, PR #43, 2026-09-21)* — de paso, extraído `OrderCardComponent` para eliminar la duplicación literal entre las dos columnas.

### Módulo del Administrador (Vista Escritorio)
- `[x]` ABM de productos con jerarquía de 7 categorías y subcategorías en cascada.
- `[x]` Importación masiva del catálogo desde Excel, con validación y rechazo de filas inválidas.
- `[x]` Plantilla de Excel descargable y borrado masivo del catálogo.
- `[x]` Control de usuarios (lista blanca de correos autorizados y roles).
- `[x]` Consolidado diario de ventas con rango de fecha/hora y exportación a XLSX.
- `[x]` Endpoint público `/menu.json` para la carta de letiende.co.
- `[x]` Producto con descripción, variantes y adiciones *(Tarea 29, PR #41, 2026-09-20)*.
- `[x]` Catálogo cargado desde la hoja `datos` del Google Sheets maestro — reestructurada por el usuario y con el primer paquete completo cargado vía Excel el mismo día.

### Calidad y Pruebas
- `[x]` Runner de pruebas configurado (Vitest vía `@angular/build:unit-test`), con el parche de `@ionic/angular` que lo desbloqueó.
- `[x]` **El CI ejecuta la suite y bloquea el merge** *(Tarea 32, PR #40, 2026-09-20)*.
- `[x]` Pruebas de las funciones puras de propina y del parser del Excel *(Tarea 29, `order-totals.spec.ts` + `import-parsers.spec.ts`, 28 casos)*.
- `[x]` Pruebas de `firestore.rules` con el emulador — 52 casos, solo en CI *(Tarea 33, PR #45, 2026-09-21)*.
- `[—]` Pruebas de componentes — **descartadas a conciencia**, ver ADR-008.
- `[—]` Pruebas E2E — diferidas, acotadas a un solo flujo. Ver ADR-008.
- `[—]` Lint — el repositorio no tiene script de lint.

---

## 3. Registro de Decisiones de Arquitectura (ADRs)

### ADR-001: Backend Serverless con Firebase (Auth + Firestore + Hosting)
*   **Fecha:** 2026-05-22
*   **Estado:** Aprobado (Fase de Planeación)
*   **Decisión:** Se opta por una solución serverless basada en Firebase para la base de datos, autenticación y despliegue del cliente estático.
*   **Razón:** El modelo de comandas requiere sincronización en tiempo real y baja latencia entre meseros y barra. Cloud Firestore permite reactividad instantánea nativa (`onSnapshot`) sin necesidad de configurar y mantener servidores Websocket complejos ni APIs REST tradicionales.
*   **Consecuencias Conocidas:** Dependencia directa del proveedor (Vendor Lock-in) de Google Cloud / Firebase. Los costos están ligados al número de lecturas/escrituras en Firestore, lo cual requiere una optimización cuidadosa en el cliente para no abrir listeners innecesarios o realizar re-renders costosos.

### ADR-002: Framework de UI Móvil Ionic + Angular Standalone + Tailwind v4
*   **Fecha:** 2026-05-22
*   **Estado:** Aprobado (Fase de Planeación)
*   **Decisión:** Seleccionar Ionic Framework para la capa de UI sobre Angular 21.2.x, complementado con Tailwind CSS v4 para estilos rápidos.
*   **Razón:** La aplicación móvil del mesero opera bajo condiciones de alto tráfico, movimiento físico y luz variable. Necesita botones grandes y layouts que resuelvan la latencia de toque móvil tradicional (clicks retrasados de 300ms en navegadores móviles). Ionic ofrece componentes Web optimizados específicamente para comportamiento táctil nativo.
*   **Consecuencias Conocidas:** Curva de aprendizaje al combinar los sistemas de temas de Ionic y las utilidades de Tailwind CSS. Es crucial no sobreescribir los estilos de interacción nativa de los componentes Ionic para evitar fallos de accesibilidad táctil.

### ADR-003: Propina Precalculada Fija en Catálogo de Eventos
*   **Fecha:** 2026-05-22
*   **Estado:** ⛔ **Reemplazado por ADR-006** (2026-09-19). Se conserva por trazabilidad; no describe el rumbo actual del producto.
*   **Decisión:** El cálculo de la propina no será porcentual libre en el momento del pago. Cada producto en el catálogo de eventos tendrá un valor de propina fijo y precalculado asociado. El total mostrado en la carta incluye ya ese valor.
*   **Razón:** Agilizar al máximo la atención tipo discoteca. El mesero no debe preguntar ni calcular el 10% mentalmente. Al cobrar, el sistema simplemente sustrae matemáticamente los valores fijos parametrizados en la base de datos para mostrar la discriminación contable exacta en el datáfono.
*   **Consecuencias Conocidas:** Si un producto cambia de precio o el porcentaje de propina pactado varía, el administrador debe actualizar el catálogo en el panel.

### ADR-004: Autenticación por Google Sign-In, Lista Blanca y Roles Dinámicos por Jornada
*   **Fecha:** 2026-05-22
*   **Estado:** Aprobado (Fase de Planeación)
*   **Decisión:** Permitir el inicio de sesión vía Google Sign-In, verificando contra una lista blanca en `/users`. Los roles son asignables dinámicamente por un administrador al inicio de cada jornada. El acceso inicial del sistema se sembrará con la cuenta administradora `letiende.co@gmail.com`.
*   **Razón:** Los colaboradores de Le Tiende rotan funciones entre mesero y barista según el día. El administrador centraliza la asignación del rol de la jornada en la base de datos.
*   **Consecuencias Conocidas:** El administrador debe asignar proactivamente el rol activo a los colaboradores al iniciar el turno. Se requiere una cuenta semilla pre-autorizada en las reglas de seguridad de Firestore para evitar que el sistema sea inaccesible en su creación inicial.

### ADR-005: Optimización Estricta para Operar en Capa Gratuita (Plan Spark de Firebase)
*   **Fecha:** 2026-05-22
*   **Estado:** Aprobado (Fase de Planeación)
*   **Decisión:** Toda la lógica de lectura y sincronización de datos en tiempo real en la aplicación del cliente se optimizará para evitar exceder las cuotas de la capa gratuita (Spark).
*   **Razón:** Garantizar costo cero de mantenimiento de base de datos e infraestructura para Le Tiende.
*   **Consecuencias Conocidas:** Se deben implementar mecanismos estrictos de desuscripción de sockets y carga diferida o almacenamiento en caché local (Angular Signals) de catálogos y resúmenes diarios.

### ADR-006: Propina Porcentual a Nivel de Pedido, Editable por el Mesero
*   **Fecha:** 2026-09-19
*   **Estado:** Aprobado e implementado por completo. **Reemplaza al ADR-003.** El cálculo (`subtotal`/`tipPercentage`/`tipValue`/`tipAmount`/`total`, 10 % por defecto) está implementado desde la Tarea 29 (2026-09-20, PR #41); la edición por el mesero, antes y después de enviar el pedido, desde la Tarea 31 (2026-09-21, PR #44).
*   **Decisión:** La propina deja de ser un valor fijo precalculado por producto (`Product.tipAmount` / `Product.totalPrice`) y pasa a calcularse sobre el pedido completo: 10 % del subtotal por defecto, ajustable por el mesero mediante un porcentaje y un valor absoluto que se suman. El pedido almacena `subtotal`, `tipPercentage`, `tipValue`, `tipAmount` y `total`.
*   **Razón:** El ADR-003 era correcto mientras el catálogo era solo el menú interno del punto de venta. Dejó de serlo cuando el mismo catálogo pasó a alimentar la lista de precios pública de letiende.co y la carta impresa: un precio de carta con la propina ya embebida es incorrecto de cara al cliente, porque la propina es voluntaria por ley (ver **Propina (Exenta)** en el glosario del `PRD.md`). Además, un 10 % calculado es más flexible que un valor fijo por producto que hay que mantener a mano en 116 filas.
*   **Consecuencias Conocidas:** La discriminación contable para el datáfono pasa de ser una *resta* (`unitPrice − tipAmount`) a una *suma* (`subtotal + tipAmount`), lo que simplifica los reportes pero obliga a tocar el consolidado del administrador. El mesero necesita permiso para modificar la propina de un pedido ya enviado a la barra: se resuelve con un helper acotado en `firestore.rules` que solo deja tocar los campos de propina y solo mientras `paid == false`. Los pedidos con el formato anterior dejan de ser legibles por los reportes; se borran, por tratarse únicamente de datos de prueba.

### ADR-007: Google Sheets como Fuente de Verdad del Catálogo
*   **Fecha:** 2026-09-19
*   **Estado:** Aprobado e implementado (Tarea 29, 2026-09-20, PR #41). El usuario ya reestructuró la hoja `datos` con las columnas nuevas y cargó el primer paquete completo de productos vía Excel.
*   **Decisión:** El catálogo maestro vive en un documento de Google Sheets con dos hojas. La hoja `datos` se exporta como XLSX y se carga en Comandante con el importador existente; es la que se persiste en `/products` y se publica en `/menu.json`. La hoja `canva` se conecta dinámicamente a Canva para generar la carta impresa en PDF, y obtiene sus nombres y precios de `datos` mediante fórmulas. Comandante no lee la hoja `canva`.
*   **Razón:** Un único punto de edición para los tres destinos del catálogo (punto de venta, carta digital de letiende.co y carta impresa), en una herramienta que el administrador ya sabe usar y que no requiere desplegar nada para cambiar un precio.
*   **Consecuencias Conocidas:** El importador se mantiene como *upsert*: crea y actualiza, pero **no archiva** los productos que desaparezcan de la hoja. Es una decisión explícita, no una omisión — para retirar un producto hay que archivarlo desde Comandante o recargar el catálogo completo tras un borrado masivo. Comandante y la hoja pueden divergir si alguien edita un producto directamente en el panel de administración; la hoja sigue siendo la referencia a la que volver.

### ADR-008: Cobertura de Pruebas por Capas, No Cobertura Total
*   **Fecha:** 2026-09-19
*   **Estado:** Aprobado e implementado por completo — las tres capas cubiertas (gate de CI, funciones puras, reglas de Firestore) ya están hechas (Tareas 32 y 33, 2026-09-20/21).
*   **Decisión:** No se persigue una suite de pruebas completa. Se cubren tres capas — el *gate* de CI, las funciones puras de dinero y parseo, y las reglas de Firestore — y se descarta explícitamente la capa de pruebas de componentes. Las pruebas E2E quedan diferidas y acotadas a un único flujo. Detalle en `tech-specs.md` §14; tareas en `TODO.md` (32 y 33).
*   **Razón:** Se estimó el costo real de una suite completa en **20-25 sesiones supervisadas**, más un impuesto permanente de mantenimiento sobre cada cambio de interfaz. Para una aplicación de ~3.800 líneas mantenida por una sola persona es desproporcionado. El costo no está en escribir las pruebas, sino en tres factores: refactorizar el código para que sea testeable (`waiter.component.ts` y `products.component.ts` suman 1.473 líneas que mezclan plantilla, lógica, Firestore y *overlays*), montar el arnés de Ionic en jsdom (que ya mordió una vez, ver Tarea 21), y mantener pruebas que afirman marcado. En esta aplicación el daño real solo puede venir de tres sitios: aritmética de propina equivocada, una importación que corrompa el catálogo, y un hueco en las reglas. Ninguno necesita pruebas de componentes.
*   **Consecuencias Conocidas:** Los componentes quedan sin red de seguridad automatizada; su verificación sigue siendo manual contra el emulador, documentada en cada tarea. Se asume ese riesgo a conciencia. Si en algún momento se parten `waiter` y `products` en piezas más pequeñas, la capa 4 deja de ser cara y conviene reevaluar esta decisión — pero ese refactor debe justificarse por mantenibilidad, no por cobertura. **Hallazgo que motivó la Tarea 32:** el CI nunca ejecutaba `npm test`, así que hasta ahora cualquier prueba del repositorio era decorativa y un PR con la suite en rojo podía fusionarse y desplegarse.

---

## 4. Dependencias Principales Instaladas

Versiones reales del `package.json`. La lista completa está en el propio archivo.

| Paquete | Versión | Propósito |
| :--- | :--- | :--- |
| `@angular/core` | `^21.2.0` | Framework base |
| `@angular/fire` | `21.0.0-rc.0` | Integración de Angular con el SDK de Firebase |
| `firebase` | `^12.4.0` | SDK de Firebase (Auth y Firestore) |
| `@ionic/angular` | `^8.8.8` | Componentes visuales móviles |
| `tailwindcss` | `^4.3.0` | Utilidades de diseño (con `@tailwindcss/postcss`) |
| `xlsx` | `^0.18.5` | Import del catálogo y export del consolidado de ventas |
| `patch-package` | `^8` | Parche del import ESM de `@ionic/angular` (ver §7) |
| `vitest` | `^4.0.8` | Runner de pruebas, vía `@angular/build:unit-test` (`npm test`) y config independiente para reglas (`npm run test:rules`) |
| `firebase-tools` | `^14.27.0` | Despliegue local, emuladores y `emulators:exec` en CI |
| `@firebase/rules-unit-testing` | `^5.0.2` | Pruebas de `firestore.rules` contra el emulador — solo corren en CI (Tarea 33, ver §7) |

En `functions/` (proyecto npm independiente, `engines.node = "24"`): `firebase-admin ^14.4.0`, `firebase-functions ^7.4.0`, `@google-cloud/firestore ^9.1.0`.

**No hay script de lint** en este repositorio. La verificación previa a un commit es `npm run build -- --configuration=production` y `npm test`. `npm run test:rules` no se corre en local — solo en CI (ver `CLAUDE.md` §7).

---

## 5. Configuraciones Vigentes

| Configuración | Detalle |
| :--- | :--- |
| **Proyecto Firebase** | `comandante-letiende` (mismo proyecto para los alias `staging` y `production`). |
| **Región de Cloud Functions** | `us-central1`. |
| **Credenciales del cliente** | `src/environments/environment.ts`, único archivo de entorno. Son llaves públicas del cliente; la seguridad real está en `firestore.rules`. |
| **Administrador semilla** | `letiende.co@gmail.com`, cableado en `firestore.rules` (`isRootAdmin()`). |
| **ID de documento en `/users`** | El **email**, no el UID de Firebase Auth. |
| **Caché de Hosting** | `**/*.@(js|css)` con `max-age=31536000, immutable`; `/menu.json` con `max-age=300`. |
| **Service account de despliegue** | `firebase-adminsdk-fbsvc@comandante-letiende.iam.gserviceaccount.com`. Los roles IAM exactos que necesita están en `TODO.md` Tarea 27 — costaron 8 intentos de despliegue descubrirlos uno a uno. |

---

## 6. Patrones de Código Establecidos

### Consumo Reactivo de Firestore con Signals

Los servicios de `src/app/core/db/` son `providedIn: 'root'`, exponen un *signal* de solo lectura y **se desuscriben del listener con `DestroyRef`** (obligatorio por el ADR-005: un listener huérfano consume cuota de la capa gratuita). Ejemplo real, de `order.service.ts`:

```typescript
@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly firestore = inject(Firestore);
  private readonly colRef = collection(this.firestore, 'orders');

  private readonly _activeOrders = signal<Order[]>([]);
  readonly activeOrders = this._activeOrders.asReadonly();

  constructor() {
    const q = query(this.colRef, where('status', 'in', ['pending', 'preparing', 'ready']));
    const unsubscribe = onSnapshot(q, (snap) => {
      this._activeOrders.set(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order),
      );
    });
    inject(DestroyRef).onDestroy(unsubscribe);
  }
}
```

Se usa `onSnapshot` directamente, no `collectionData()`, para controlar la desuscripción de forma explícita.

### Otros patrones vigentes

- **Componentes Standalone con plantilla y estilos en línea.** Salvo `app.component`, ningún componente tiene archivos `.html`/`.css` separados. No existe carpeta `shared/`.
- **Fuente única de verdad para las enumeraciones de dominio.** `core/models/category-tree.ts` alimenta el tipo de TypeScript, el filtro de la interfaz, los selects en cascada y la validación del import. Mismo patrón aplicado a `core/models/payment-methods.ts` (Tarea 31): es el que copiar para cualquier lista cerrada nueva.
- **Diálogos con los controladores de Ionic.** No se usa `ion-modal` en ningún punto del proyecto: las elecciones simples van con `ActionSheetController`, las confirmaciones y los formularios de un solo campo `checkbox`/`radio` con `AlertController`. Para más de un campo de texto/número con label real, `AlertController` no alcanza (ver gotcha en §7) — usar un overlay propio con un *signal* de visibilidad, como el formulario de productos o el diálogo de propina del mesero (`tipEditOpen()`).
- **Escrituras masivas en lotes de 500.** `writeBatch` con el límite de Firestore, en `importProducts()` y `deleteAllProducts()`.

---

## 7. Gotchas Conocidos (Problemas Frecuentes)

Hallazgos verificados empíricamente durante el desarrollo. El detalle completo, con síntoma, causa raíz y solución, está en **`CLAUDE.md` §7**; esta tabla es el índice.

| Situación | Causa raíz | Solución |
| :--- | :--- | :--- |
| Tailwind no se aplica pese a tener `postcss.config.js`. | El builder `@angular/build:application` (esbuild) **solo** carga configuración PostCSS desde JSON; ignora `.js`/`.mjs` por diseño. | Usar `postcss.config.json`. |
| Layout colapsado en móvil: una franja de contenido y el resto negro. | `<ion-page>` **no es un web component de Ionic**: es un elemento desconocido con `display:inline` dentro del flex container que `IonRouterOutlet` crea. | La plantilla empieza directamente con `<ion-header>` / `<ion-content>`, sin envoltura. Nunca añadir `CUSTOM_ELEMENTS_SCHEMA` para esquivarlo. |
| El avatar de Google devuelve `429 Too Many Requests`. | `lh3.googleusercontent.com` bloquea peticiones con un `Referer` que no reconoce. | `referrerpolicy="no-referrer"` en todo `<img>` que cargue una URL de Google. |
| Escrituras denegadas con `permission-denied` aunque el rol sea correcto. | En Firestore Rules, `&&` retorna **booleano**, no el último valor evaluado como en JavaScript: `userRole()` devolvía `true` en vez del string del rol. | Usar operador ternario `? :` para retornar el string. |
| Una clase como `text-[#FFE7B3]/55` no aplica ningún estilo. | En Tailwind v4, los modificadores de opacidad combinados con colores arbitrarios entre corchetes no siempre generan la regla CSS durante el escaneo JIT. | Definir el color con opacidad en los `styles` del componente, no con clases Tailwind. |
| `npm test` fallaba con `Directory import '@ionic/core/components' is not supported`. | `@ionic/angular@8.8.8` importa un directorio sin `/index.js`, y Node ESM nativo no resuelve *directory imports*. | Parche vía `patch-package` (carpeta `patches/`, aplicado en `postinstall`) más un alias en `vitest.config.ts`. |
| Doble cobro al tocar varias veces el botón de envío. | Latencia de red móvil. | Estado reactivo `submitting` que deshabilita el botón tras el primer toque (ya implementado en el mesero). |
| Un cambio en `firestore.rules` "se ve y luego revierte" en el canal de preview de un PR. | El job `preview` de CI solo despliega Hosting; las reglas solo se despliegan en `deploy_live` (push a `main`). El preview corre contra las reglas ya vigentes en producción, nunca contra las del PR. | No se puede verificar de punta a punta en preview — desde la Tarea 33, `firestore.rules.spec.ts` corre solo en CI contra el emulador real (`firebase emulators:exec`), sin depender de Java local ni del canal de preview. |
| `AlertController` con inputs de texto/número: sin label visible y el valor no se aplica al aceptar. | `AlertInput.label` solo se renderiza para `radio`/`checkbox`; un botón sin `handler` devuelve los valores anidados bajo `data.values.*`, no en `data.*`. | Usar el patrón de overlay propio con signal de visibilidad (`showForm()` en productos, `tipEditOpen()` en el mesero) en vez de `AlertController` cuando se necesite más de un campo de texto/número con label real. |
| El log de CI vuelve a advertir sobre deprecación de Node 20 al agregar una acción nueva al workflow, aunque `checkout`/`setup-node` ya estén en Node 24. | Cada acción de GitHub declara su propio runtime (`node20`/`node24`) en su `action.yml`, independiente del `node-version` que configura `setup-node` para construir la app. `actions/setup-java@v4` (Tarea 33) todavía declaraba `node20`. | Revisar/actualizar a la versión más reciente de la acción nueva (`setup-java@v4`→`@v5` lo resolvió, mismo patrón que `checkout`/`setup-node` en la Tarea 28). No asumir que la migración a Node 24 es un estado permanente del workflow completo. |
| `firebase deploy --only functions --force` no logra configurar la política de limpieza de Artifact Registry — advertencia en cada deploy. | `--force` solo evita el *prompt* interactivo; la cuenta de servicio de CI no tiene permiso IAM para configurar la política. | `npx firebase-tools functions:artifacts:setpolicy --project comandante-letiende --days 1 --force`, una sola vez, en local con una cuenta con permisos suficientes (Tarea 34). Queda fijada en el repositorio de Artifact Registry, no en la cuenta de servicio. |

---

## 8. Documentos de Referencia

Rutas relativas a la raíz del repositorio.

| Archivo | Ruta | Propósito |
| :--- | :--- | :--- |
| **PRD** | `PRD.md` | Requisitos funcionales de producto, casos de uso y glosario de negocio. |
| **Tech Specs** | `tech-specs.md` | Arquitectura, modelos de datos, infraestructura y contrato de `/menu.json`. |
| **TODO** | `TODO.md` | Motor de planificación JIT: tareas activas, cola e historial completo. |
| **Reglas de IA** | `CLAUDE.md` | Stack, convenciones, seguridad OWASP, Git Flow y gotchas del stack. |
| **Diseño** | `DESIGN.md` | Sistema visual: paleta, tipografía y ratios de contraste aprobados. |
| **Planteamiento inicial** | `docs/planteamiento-inicial.md` | Documento original con las necesidades de Le Tiende. |
| **Cambio de modelo de datos** | `docs/cambio-en-modelo-de-datos.md` | Especificación del cambio pendiente (Tareas 29-31) y decisiones tomadas. |
| **Detalle de reportes** | `docs/aumento-detalle-reportes.md` | Especificación de mejoras al consolidado de ventas. |

---

## 9. Contexto de la Sesión Actual

- **Fecha:** 2026-09-22
- **Qué se hizo:**
  - PR #46 (setup-java v5) fusionado y desplegado sin errores. Nueva advertencia en el job `deploy_live`, ajena al código: sin política de limpieza de imágenes en Artifact Registry, y `--force` no basta para que Firebase la configure sola (falta un permiso IAM en la cuenta de servicio de CI, no cubierto por los roles ya documentados en la Tarea 27). Resuelto en un solo comando, en local, con la cuenta del dueño del proyecto: `firebase functions:artifacts:setpolicy --days 1 --force`. Tarea 34 (externa, sin slot de WIP). Gotcha nuevo en `CLAUDE.md` §7.
  - Sesión anterior (2026-09-21), resumida abajo:
  - Completados los ciclos de las **Tareas 30 y 31** (ver detalle en las dos entradas anteriores de esta sección en el historial de sesiones — incidente del PR #42, y los dos bugs del diálogo de propina más el descubrimiento de que el preview nunca despliega `firestore.rules`).
  - **Confirmado en producción** (tras el deploy de la Tarea 31): la edición de propina de un pedido ya creado funciona correctamente — validó la hipótesis del gotcha del canal de preview sin necesidad de instalar nada.
  - Implementada la **Tarea 33** — pruebas de `firestore.rules`: `firestore.rules.spec.ts` con 52 casos (`@firebase/rules-unit-testing`) cubriendo `/users`, `/products` y `/orders` por rol × operación, incluida la regresión explícita del bug de propina recién confirmado. El usuario dejó clara su preferencia antes de empezar (no le interesa instalar Java, desconfía de Oracle): se diseñó para correr **solo en CI**, nunca en local — el runner de GitHub Actions ya trae JVM. Verificado con el run real de GitHub Actions (`gh run watch`), no en local: 52/52 en verde. PR #45.
  - **Corrección menor encontrada por el usuario en el primer run de CI, ya fusionado:** `actions/setup-java@v4` disparaba el aviso de deprecación de Node 20 en runners de GitHub Actions (la acción nueva de esta tarea todavía declaraba ese runtime, aunque `checkout`/`setup-node` ya estaban en Node 24 desde la Tarea 28). Corregido a `@v5`, que además resuelve el aviso propio de que `v4` está deprecada. Documentado como gotcha nuevo en `CLAUDE.md` §7: revisar el runtime de cualquier acción nueva que se agregue al workflow, no asumir que la migración a Node 24 ya cubre todo.
  - Documentación actualizada en el PR de cierre: `tech-specs.md` (§13 vacía — ciclo completo cerrado; tabla de capas de §14 con las cuatro etapas marcadas como hechas), `TODO.md` (Tarea 33 al historial junto con la corrección de `setup-java`, cola de tareas vacía), `CLAUDE.md` §7 (gotcha nuevo sobre acciones de CI y Node 24) y este `MEMORY.md` (checklist, ADR-008 implementado por completo, tabla de estado, gotchas indexados, este contexto).
- **Próxima Tarea:** ninguna en cola. El ciclo completo de `docs/cambio-en-modelo-de-datos.md` (Tareas 29-31) y del ADR-008 (Tareas 32-33) queda cerrado. Reevaluar contra `PRD.md` cuando el usuario retome.
