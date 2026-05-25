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
