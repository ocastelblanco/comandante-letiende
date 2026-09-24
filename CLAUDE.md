# CLAUDE.md — Instrucciones del Proyecto Comandante

Este archivo contiene las directrices permanentes de arquitectura, código, seguridad y flujo de desarrollo para agentes IA y desarrolladores en el proyecto **Comandante**.

---

## 1. Descripción del Proyecto
**Comandante** es una aplicación web responsiva (Mobile-First para meseros, Tablet para baristas, Desktop para administrador) para la toma ágil de pedidos, cálculo automático de discriminación de propinas para cobros en datáfonos, cola digital de preparación en barra y consolidación diaria de ventas para el centro cultural **Le Tiende** (Bogotá, Colombia).

---

## 2. Stack Tecnológico y Versiones
- **Frontend Framework:** Angular 21.2.x (Standalone components, Signals, Router)
- **UI Framework:** Ionic Framework (Angular) 8.x
- **CSS Utility:** Tailwind CSS 4.x
- **Backend/Database:** Cloud Firestore SDK v10+
- **Autenticación:** Firebase Authentication SDK v10+ (Google Sign-In)
- **Despliegue/Hosting:** Firebase Hosting

---

## 3. Comandos de Uso Común
- **Iniciar servidor de desarrollo local:** `npm run start` (o `ng serve`)
- **Ejecutar pruebas unitarias:** `npm run test`
- **Compilar producción (Build):** `npm run build -- --configuration=production`
- **Desplegar en Staging:** `npx firebase deploy --only hosting -P staging`
- **Desplegar en Producción:** `npx firebase deploy --only hosting -P production`

---

## 4. Convenciones de Código e Idioma
- **Idioma del Código:** Variables, funciones, clases, bases de datos y commits en **Inglés** (ej. `totalAmount`, `OrderService`, `getPendingOrders`).
- **Idioma de Interfaz y Comentarios:** Español (Colombia) en comentarios, documentación, manuales y textos de cara al usuario final.
- **Patrones Reactivos:** Uso preferencial de **Angular Signals** para el manejo de estados de interfaz en lugar de `BehaviorSubject`.
- **Estructura de Componentes:** Componentes Standalone obligatorios. Estilos y plantillas en línea para componentes muy pequeños (< 100 líneas); archivos separados (`.html`, `.css`) para componentes grandes.
- **Tipado:** TypeScript estricto. Prohibido el uso de `any`.

---

## 5. Seguridad (OWASP)

Esta sección define las reglas de seguridad obligatorias basadas en los riesgos específicos de nuestra arquitectura serverless (Angular + Firebase).

### Riesgos Identificados y Reglas de Código

#### A01:2021 — Control de Acceso Roto (Acceso no autorizado a pedidos o catálogo)
*   **Riesgo:** Un usuario mesero o externo podría acceder al panel de administración, modificarse su propio rol para promoverse a administrador o editar productos directamente.
*   **Regla:** Los guardias de Angular (`AuthGuard`, `RoleGuard`) son solo para experiencia de usuario. La seguridad real DEBE implementarse en las **Reglas de Seguridad de Cloud Firestore** (`firestore.rules`). Ninguna escritura en `/products` o `/users` está permitida excepto si el usuario autenticado posee rol `admin` o corresponde al correo raíz `letiende.co@gmail.com`. Los usuarios no administradores tienen estrictamente prohibido alterar su propio campo `role`.

#### A02:2021 — Fallas Criptográficas (Fuga de Secretos)
*   **Riesgo:** Credenciales de administración o claves API del backend expuestas en el código subido al repositorio público.
*   **Regla:** Las llaves del cliente de Firebase se cargan mediante variables en `src/environments/`. Nunca almacenes credenciales privadas de cuentas de servicio de Google Cloud (`.json`) en el repositorio.

#### A03:2021 — Inyección (Cross-Site Scripting — XSS)
*   **Riesgo:** Renderizar nombres de productos o comentarios ingresados por usuarios que contengan scripts maliciosos.
*   **Regla:** Utiliza siempre la interpolación de plantillas estándar de Angular `{{ value }}`. Prohibido el uso de `ElementRef.nativeElement.innerHTML` o la inyección directa con `bypassSecurityTrustHtml` de Angular sin sanitización explícita previa con `DomSanitizer`.

#### A07:2021 — Fallas de Identificación y Autenticación
*   **Riesgo:** Cierre de sesión incompleto o uso de tokens revocados.
*   **Regla:** Al cerrar sesión, destruye la sesión mediante `signOut(auth)` de Firebase y limpia cualquier estado reactivo (Signals) inmediatamente antes de redirigir a `/login`.

#### Control de Consumos y Límites (Plan Spark de Firebase)
*   **Riesgo:** Que el volumen de lecturas/escrituras en Firestore exceda la cuota diaria gratuita (50,000 lecturas) y deje inoperante el sistema para la jornada.
*   **Regla:** Desuscribirse sistemáticamente de los listeners en tiempo real (`onSnapshot`) de Firestore al desmontar componentes de Angular. Almacenar en caché local el catálogo de productos utilizando Angular Signals. Prohibido implementar polling manual.

### Prohibiciones Absolutas en el Código

| Acción Prohibida | Por qué |
| :--- | :--- |
| Dejar Firestore Rules con `allow read, write: if true;` | Expone toda la base de datos a borrado o modificación pública. |
| Hardcodear objetos `user` simulados en producción | Salta las validaciones del servidor y puede dejar brechas en auditorías. |
| Guardar roles en el `localStorage` del cliente para validar permisos | Los datos del cliente pueden ser manipulados fácilmente con las herramientas de desarrollador. |
| Utilizar sentencias `eval()` o `new Function()` | Abre vectores de ejecución de código arbitrario (XSS). |

---

## 6. Git Flow para Agentes IA

Las siguientes reglas son **absolutamente obligatorias y no tienen excepción**, incluso si el usuario lo solicita explícitamente.

> **⛔ PROHIBICIÓN CRÍTICA: Un agente IA NUNCA puede hacer commits ni push directamente a `main`. Toda modificación de código debe llegar únicamente a través de un Pull Request revisado y aprobado por un humano.**

### Mapa de Ramas

| Rama | Propósito | Protegida |
| :--- | :--- | :--- |
| `main` | Código en producción (`comandante.letiende.co`). Solo recibe merges aprobados vía PR. | ✅ Sí |
| `feature/*` | Nuevas funcionalidades. Se crea siempre desde `main`. | No |
| `fix/*` | Correcciones de bugs. Se crea desde `main`. | No |
| `docs/*` | Solo documentación. Se crea desde `main`. | No |
| `hotfix/*` | Correcciones urgentes en producción. Se crea desde `main`. | No |
| `refactor/*` | Refactorizaciones sin cambio funcional. Se crea desde `main`. | No |

### Protocolo Obligatorio Antes de Cualquier Cambio de Código

**Paso 1 — Verificar en qué rama estoy:**
```bash
git branch --show-current
```
Si el resultado es `main`: **detener todo y ejecutar el Paso 2**.
Si ya hay una feature branch activa: continuar desde el Paso 3.

**Paso 2 — Crear feature branch (SIEMPRE desde `main`):**
```bash
git checkout main
git pull origin main
git checkout -b docs/descripcion-corta-en-kebab-case
```

**Paso 3 — Hacer los cambios y commitear:**
```bash
# Solo después de que el build pase sin errores
npm run build

# Agregar archivos específicos — NUNCA git add . o git add -A
git add src/app/features/waiter/waiter.component.ts

# Commit con formato semántico en inglés (código) / español colombiano (alcance)
git commit -m "feat(waiter): add customer name field to order"
```

**Paso 4 — Crear el Pull Request al finalizar:**
```bash
git push -u origin HEAD
gh pr create \
  --base main \
  --title "feat(waiter): add customer name field to order" \
  --body "## Cambios realizados
- [bullet con cada cambio]

## Cómo probar
- [pasos verificables]

## Checklist
- [ ] Build pasa sin errores
- [ ] No hay secretos hardcodeados
- [ ] Seguí las convenciones de código del proyecto

🤖 Generado con Antigravity"
```

### Prohibiciones Absolutas de Git

| Acción Prohibida | Por Qué |
| :--- | :--- |
| `git push origin main` | Commit directo a producción — **terminantemente prohibido** |
| `git commit` estando en `main` | Genera historial sucio en la rama protegida |
| `git push --force` en cualquier rama | Destruye el historial del repositorio |
| `git merge` de cualquier PR | Solo humanos pueden aprobar y fusionar PRs |
| `gh pr merge` | Solo humanos pueden fusionar PRs |
| `git add .` o `git add -A` | Puede incluir secretos, `.env` o archivos temporales |
| `--no-verify` en commits o pushes | Omite hooks de seguridad configurados |

### El Agente NUNCA Debe
- Fusionar un PR (ni con `gh pr merge`, ni con `git merge`).
- Aprobar su propio PR.
- Hacer push a `main` bajo ninguna circunstancia, incluso si el usuario lo pide.
- Usar `--force`, `--no-verify`, ni `--no-gpg-sign`.
- Cerrar un PR sin fusionar cuando el trabajo está completo — dejarlo abierto para revisión humana.

---

## 7. Hallazgos Técnicos del Stack (Gotchas)

Esta sección documenta comportamientos no obvios descubiertos durante el desarrollo. Leer antes de tocar la configuración del build.

### Tailwind CSS 4.x + `@angular/build:application` — Solo acepta PostCSS en JSON

**Síntoma:** Si creas un `postcss.config.js` o `postcss.config.mjs` con el plugin de Tailwind, el build de Angular lo ignora silenciosamente. Tailwind no se aplica.

**Causa:** El builder `@angular/build:application` (esbuild) solo carga configuración PostCSS desde archivos en formato JSON: `postcss.config.json` o `.postcssrc.json`. Los archivos `.js`/`.mjs` son ignorados por diseño (ver `node_modules/@angular/build/src/utils/postcss-configuration.js`).

**Solución correcta:**
```json
// postcss.config.json (en la raíz del workspace)
{
  "plugins": {
    "@tailwindcss/postcss": {}
  }
}
```
```css
/* src/styles.css */
@import "tailwindcss";
```
**Dependencias requeridas:** `tailwindcss`, `@tailwindcss/postcss`, `postcss` (todas en `devDependencies`).

### ⚠️ NO usar `<ion-page>` en templates de componentes Standalone

**Síntoma:** Layout completamente colapsado en móvil: solo una franja del contenido visible arriba y fondo negro el resto de la pantalla.

**Causa raíz:** `<ion-page>` NO es un web component de Ionic. No existe ningún archivo de componente para él en `@ionic/core`. Es simplemente un elemento HTML desconocido (no registrado como custom element). Al usarlo como contenedor en el template, queda con `display: inline` dentro del flex container `.ion-page` que `IonRouterOutlet` añade al host del componente. Un flex item inline con `height: auto` rompe la resolución de `height: 100%` de `ion-content`.

**Cómo funciona realmente:** `IonRouterOutlet` añade la clase CSS `.ion-page` directamente al **elemento host del componente** (ej. `<app-login>`, `<app-products>`). Esa clase aplica `position: absolute; inset: 0; display: flex; flex-direction: column` y lo convierte en el contenedor de página a pantalla completa. El template del componente debe empezar directamente con `<ion-header>` y/o `<ion-content>`, sin envoltura adicional.

**Solución correcta — página con header:**
```typescript
@Component({
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent],
  template: `
    <ion-header>
      <ion-toolbar><ion-title>Título</ion-title></ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <!-- contenido -->
    </ion-content>
  `,
})
export class MiPagina {}
```

**Solución correcta — página sin header (ej. login):**  
`ion-content { height: 100% }` puede no resolver si el host aún no tiene dimensiones definitivas en el primer paint. Usar un contenedor `position: fixed; inset: 0` que no depende de ninguna cadena de alturas padre:
```typescript
@Component({
  standalone: true,
  styles: [`:host { display: block; height: 100%; }`],
  template: `
    <div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;overflow-y:auto">
      <!-- contenido centrado -->
    </div>
  `,
})
export class LoginPage {}
```

**Nunca agregar `CUSTOM_ELEMENTS_SCHEMA` solo para poder escribir `<ion-page>`** — ese schema suprime errores del compilador y enmascara elementos mal escritos. Solo usarlo cuando se integran web components de terceros genuinamente no disponibles como imports de Angular.

### ⚠️ Avatar de Google (lh3.googleusercontent.com) — 429 Too Many Requests

**Síntoma:** La imagen del avatar del usuario de Google devuelve `429 Too Many Requests` cuando se renderiza en la app.

**Causa raíz:** El servidor de imágenes de Google (`lh3.googleusercontent.com`) bloquea peticiones que envían un `Referer` header que no reconoce (p.ej. `localhost` o el dominio de la app). Al omitir el referer la petición pasa sin restricciones.

**Solución obligatoria:** Añadir siempre `referrerpolicy="no-referrer"` en cualquier `<img>` que cargue una URL de Google:

```html
<img [src]="photoURL" alt="avatar" referrerpolicy="no-referrer" ... />
```

Aplica a todos los componentes que muestren el avatar del usuario (waiter toolbar, admin sidebar, login, etc.).

### ⚠️ Firestore Security Rules — `&&` retorna `bool`, no el último valor

**Síntoma:** Escrituras (create/update) en Firestore fallan con `permission-denied` aunque el documento del usuario existe y tiene el rol correcto. Las lecturas funcionan bien porque no dependen de `userRole()`.

**Causa raíz:** En Firestore Security Rules, el operador `&&` siempre retorna un valor **booleano**, no el último valor evaluado como en JavaScript. Si `userRole()` usa `&&` para retornar el string del rol:
```javascript
// ❌ INCORRECTO — retorna true (bool), no 'waiter' (string)
function userRole() {
  return isAuthenticated()
      && exists(/databases/$(database)/documents/users/$(request.auth.token.email))
      && get(/databases/$(database)/documents/users/$(request.auth.token.email)).data.role;
}
```
Cuando las tres condiciones son verdaderas, `&&` retorna `true` (bool). Luego `isWaiter()` evalúa `true == 'waiter'` → `false`. Todas las escrituras quedan denegadas.

**Solución obligatoria:** Usar operador ternario `? :` para retornar el string del rol directamente:
```javascript
// ✅ CORRECTO — retorna 'waiter' (string) o null
function userRole() {
  return isAuthenticated()
      && exists(/databases/$(database)/documents/users/$(request.auth.token.email))
      ? get(/databases/$(database)/documents/users/$(request.auth.token.email)).data.role
      : null;
}
```

### ⚠️ Tailwind v4 — modificadores de opacidad con colores arbitrarios no generan CSS

**Síntoma:** Una clase como `text-[#FFE7B3]/55` no aplica ningún estilo — el texto queda invisible sobre fondos oscuros. Solo el elemento con la clase activa (p.ej. `routerLinkActive`) es visible porque tiene `color !important` definido en CSS de componente.

**Causa raíz:** En Tailwind v4, los modificadores de opacidad (ej. `/55`) combinados con valores de color arbitrarios en corchetes (ej. `[#FFE7B3]`) no siempre generan la regla CSS correspondiente durante el escaneo JIT.

**Solución:** Definir el color con opacidad directamente en los estilos del componente Angular en lugar de usar clases Tailwind:

```typescript
// ✅ Correcto — en styles del @Component
styles: [`
  .nav-link { color: rgba(255, 231, 179, 0.55); }
  .nav-link:hover { color: #FFE7B3; }
`]

// ❌ Evitar en el template
// class="text-[#FFE7B3]/55"
```

### ⚠️ El canal de preview de un PR nunca despliega `firestore.rules`

**Síntoma:** Un cambio en `firestore.rules` (ej. un helper nuevo que autoriza una escritura) se ve en preview como si no existiera: la UI aplica el cambio localmente por un instante (escritura optimista del SDK de Firestore) y un momento después revierte al valor anterior, sin ningún error visible en la consola de la app.

**Causa raíz:** `.github/workflows/deploy-hosting.yml` tiene dos jobs. `preview` (dispara con `pull_request`) solo corre `FirebaseExtended/action-hosting-deploy@v0` — despliega **Hosting únicamente**. El paso `firebase deploy --only firestore:rules,functions` solo existe en el job `deploy_live` (dispara con `push` a `main`). Como el canal de preview de cualquier PR comparte el mismo proyecto de Firestore que producción (`.firebaserc`: `staging` y `production` apuntan al mismo proyecto), las reglas *realmente activas* durante la revisión de un PR son siempre las que ya están en `main` — nunca las del branch del PR. El síntoma de "cambia y vuelve" es el rollback optimista estándar de Firestore: el cliente aplica la escritura al caché local de inmediato, el servidor la rechaza por `permission-denied` contra las reglas viejas, y el SDK revierte el caché.

**Solución:** una regla de seguridad nueva o modificada **no se puede verificar de punta a punta en el canal de preview**. Se verifica leyendo la regla con cuidado (comparándola con helpers ya probados en producción) y, si hace falta evidencia empírica antes de fusionar, contra el emulador de Firestore (`firebase emulators:start --only firestore` + `@firebase/rules-unit-testing`) — requiere Java instalado localmente. Si no se dispone del emulador, se fusiona confiando en la revisión manual y se verifica el comportamiento real recién en producción, tras el deploy de `deploy_live`. **Desde la Tarea 33** (2026-09-21) existe una tercera opción, la que usa este repo: correr `@firebase/rules-unit-testing` **solo en CI** (`firestore.rules.spec.ts`, `npm run test:rules`, invocado vía `firebase emulators:exec` en `.github/workflows/deploy-hosting.yml`) — el runner de GitHub Actions ya trae JVM, así que ninguna máquina local necesita Java, y el resultado real del run de CI reemplaza tanto a la revisión manual como a correr el emulador en local.

### ⚠️ `AlertController` — inputs de texto/número no soportan `label` visible, y los valores llegan anidados bajo `data.values`

**Síntoma:** Un diálogo de `AlertController` con `inputs` de `type: 'number'`/`'text'` no muestra ninguna etiqueta persistente junto al campo (el `placeholder` desaparece en cuanto el campo trae un `value` precargado). Además, si el botón de confirmar no tiene `handler`, el valor que el usuario escribió se pierde: al leer `alert.onWillDismiss()`, `data.<nombreDelInput>` llega `undefined`.

**Causa raíz:** verificado en el código fuente de `@ionic/core` (`dist/types/components/alert/alert-interface.d.ts` y `dist/collection/components/alert/alert.js`). `AlertInput.label` solo se renderiza para `type: 'radio'`/`'checkbox'` (`renderRadio()`/`renderCheckbox()`); los inputs de texto/número (`renderInput()`) solo soportan `placeholder`. Y en `buttonClick()`, un botón **sin** `handler` resuelve el dismiss con `{ values }` — es decir, los valores de los inputs quedan anidados bajo la clave `values` (`data.values.miInput`), no en `data.miInput` directamente. `getValues()` sí devuelve el array plano de valores marcados cuando `inputType === 'checkbox'` (por eso `openAdditionsAlert()` en `waiter.component.ts`, que lee `data.values` para checkboxes, funciona bien), pero para inputs de texto/número el objeto sigue viviendo bajo `.values`.

**Solución:** si un diálogo necesita más de un campo de texto/número con label real, no usar `AlertController` — usar el patrón de **overlay propio con signal de visibilidad** ya establecido en el repo (ver `products.component.ts`, `showForm()`, y el diálogo de propina en `waiter.component.ts`, `tipEditOpen()`): un `<div>` `position:fixed` con `ion-item`/`ion-label position="stacked"`/`ion-input`, controlado por signals propios, sin depender de la forma de los datos que devuelve Ionic al cerrar el overlay. Si de todos modos se usa `AlertController` con inputs de texto, leer siempre `data.values.<nombre>`, nunca `data.<nombre>`.

### ⚠️ Una GitHub Action nueva puede reintroducir el aviso de deprecación de Node 20, aunque `checkout`/`setup-node` ya estén al día

**Síntoma:** El log de un job de CI muestra `Node 20 is being deprecated. This workflow is running with Node 24 by default...` a pesar de que `actions/checkout@v5` y `actions/setup-node@v5` (los que ya se actualizaron en la Tarea 28 para eliminar este mismo aviso) siguen ahí sin cambios.

**Causa raíz:** el aviso no es por el `node-version` que el propio workflow configura para *construir la app* (eso es un input de `actions/setup-node`, independiente) — es sobre el runtime de Node.js que usa GitHub Actions internamente para **ejecutar el código JavaScript de cada acción** del workflow. Cada acción declara su propio runtime en su `action.yml` (`using: 'node20'` o `'node24'`). Añadir una acción nueva sin verificar esto reintroduce el aviso aunque el resto del workflow ya esté en Node 24 — pasó con `actions/setup-java@v4` (Tarea 33), que todavía declaraba `node20`.

**Solución:** al agregar cualquier acción nueva a `.github/workflows/`, revisar en el propio log de CI si dispara el aviso de deprecación (o, antes de agregarla, buscar su changelog/release notes por una versión más reciente que declare explícitamente soporte para Node 24). En este caso, `actions/setup-java@v4` → `@v5` lo resolvió — mismo patrón que `actions/checkout@v4`→`@v5` y `actions/setup-node@v4`→`@v5` en la Tarea 28. No asumir que "ya migramos a Node 24" es un estado permanente: es una propiedad por-acción que hay que revisar cada vez que se agrega una acción nueva.

### ⚠️ `firebase deploy --only functions --force` no puede configurar la política de limpieza de Artifact Registry

**Síntoma:** El deploy de Cloud Functions termina bien (`Skipped` o `Successful update`), pero muestra: `No cleanup policy detected for repositories in us-central1`, seguido de `Failed to set up cleanup policy for repositories in region us-central1`, incluso pasando `--force` en el comando de deploy.

**Causa raíz:** `--force` solo evita el *prompt* interactivo de confirmación — no sustituye un permiso IAM que falte. La cuenta de servicio de CI (`firebase-adminsdk-fbsvc@...`, roles documentados en la Tarea 27) no tiene permiso para configurar políticas de limpieza en Artifact Registry, así que el intento automático de Firebase durante el deploy falla silenciosamente (el deploy de la función en sí no se ve afectado). Sin la política, las imágenes de contenedor de cada deploy con cambios de código se acumulan indefinidamente — costo pequeño pero creciente.

**Solución:** no hace falta ampliar los permisos de la cuenta de servicio de CI. Se configura **una sola vez**, en local, con una cuenta que sí tenga permisos suficientes en el proyecto (la del dueño, ya autenticada vía `firebase login`):
```bash
npx firebase-tools functions:artifacts:setpolicy --project comandante-letiende --days 1 --force
```
La política queda fijada en el repositorio de Artifact Registry (`gcf-artifacts`), no en la cuenta de servicio — los deploys de CI posteriores ya no intentan configurarla porque detectan que ya existe.

### ⚠️ Página de Ionic con `:host { display: block; height: 100% }` — el contenido se corta por abajo

**Síntoma:** en móvil, el contenido de una página con `ion-header` + `ion-content` (barista, vistas del administrador) queda cortado en la parte inferior, aunque no haya footer; en el administrador la barra de navegación inferior fija tapa además lo poco que queda.

**Causa raíz:** `IonRouterOutlet` añade la clase `.ion-page` al elemento host del componente, y esa clase aplica `display:flex; flex-direction:column; position:absolute; top/bottom:0` (verificado en `ionic.bundle.css`). Un `:host { display: block; height: 100%; }` en los `styles` del componente **pisa** ese `display:flex` (el CSS del componente se inyecta después, con igual especificidad). Con `display:block`, `ion-content` (que mide `height:100%`) se apila *debajo* del `ion-header` en vez de repartirse la altura, y se desborda por abajo exactamente la altura del header, recortado por el `overflow:hidden` de la página.

**Solución:** no declarar `display` ni `height` en el `:host` de una página que use `ion-header`/`ion-content`; el `.ion-page` que pone Ionic ya resuelve el layout (ver también el gotcha de `<ion-page>` más arriba). La excepción es una página sin header que se centra con `position:fixed` (el login). Se corrigió en la Tarea 36 en barista y en las cinco vistas del administrador.

### ⚠️ `onSnapshot` sin callback de error — la pantalla se "congela" y nada lo avisa

**Síntoma:** las interfaces dejan de actualizarse en tiempo real (p. ej. el mesero no ve un pedido pasar a `listo`) hasta que se recarga la página. Reproducible: el mesero cierra sesión, la barra cambia un pedido, el mesero vuelve a entrar en la misma pestaña.

**Causa raíz:** si el listener de `onSnapshot` recibe un error definitivo (`permission-denied` por cierre de sesión o token vencido, `resource-exhausted`, error interno), Firestore lo **cancela para siempre**. Los servicios `providedIn: 'root'` son singletons que se suscribían una sola vez en el constructor y **sin** tercer argumento (callback de error): el listener moría sin dejar rastro y las señales conservaban el último estado. Los cortes de red transitorios, en cambio, el SDK los reconecta solo.

**Solución:** nunca llamar `onSnapshot` a pelo en un servicio. Usar `connectWhileAuthenticated()` (`core/db/live-listener.ts`), que envuelve el listener en `ResilientListener` (reintento con espera exponencial, aviso de estado), lo ata a `AuthService.isAuthenticated` (se conecta al iniciar sesión; al cerrarla se cancela y se limpia la señal, OWASP A07) y lo registra en `RealtimeStatusService` (aviso global y reintento al volver a la pestaña o recuperar la red). Una recarga automática periódica **no** es la solución: pierde el pedido en curso, gasta cuota del plan Spark y oculta la causa.

### ⚠️ Un campo nuevo que el cliente escribe exige desplegar antes `firestore.rules`, y el CI no despliega índices

**Síntoma:** en el canal de preview de un PR, una acción que escribe un campo nuevo (p. ej. `deliveredAt` al entregar un pedido) "se ve y luego revierte", o una consulta nueva falla con `failed-precondition` ("The query requires an index").

**Causa raíz:** dos límites del pipeline, ambos verificados en `.github/workflows/deploy-hosting.yml`. (1) El job `preview` solo despliega Hosting, así que el cliente del PR corre contra las reglas de `main` (ver el gotcha del canal de preview). (2) Ni siquiera `deploy_live` despliega `firestore.indexes.json`: solo corre `firebase deploy --only firestore:rules,functions`.

**Solución:** (1) si una tarea necesita ampliar una regla para que el cliente escriba un campo nuevo, **separar la regla en un PR previo, compatible hacia atrás** (aceptar el campo sin exigirlo), y fusionarlo antes; así el PR de la funcionalidad se puede probar de punta a punta en preview. La Tarea 37 lo hizo así (PR de `onlyMarksDelivered()` + `deliveredAt`). (2) diseñar las consultas para que se resuelvan con índices de campo único: varias igualdades (`status == 'delivered' && paid == false`), o un único rango con `orderBy` sobre el mismo campo (`deliveredAt >= x` + `orderBy('deliveredAt')`), filtrando el resto en el cliente. Si de verdad hace falta un índice compuesto, desplegarlo a mano (`firebase deploy --only firestore:indexes`) antes de fusionar.

