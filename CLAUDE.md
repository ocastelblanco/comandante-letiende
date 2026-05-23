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

> **⛔ PROHIBICIÓN CRÍTICA: Un agente IA NUNCA puede hacer commits ni push directamente a `main` ni a `develop`. Toda modificación de código debe llegar únicamente a través de un Pull Request revisado y aprobado por un humano.**

### Mapa de Ramas

| Rama | Propósito | Protegida |
| :--- | :--- | :--- |
| `main` | Código en producción (`comandante.letiende.co`). Solo recibe merges aprobados de `develop`. | ✅ Sí |
| `develop` | Rama de integración. Recibe merges de feature branches aprobadas. | ✅ Sí |
| `feature/*` | Nuevas funcionalidades. Se crea siempre desde `develop`. | No |
| `fix/*` | Correcciones de bugs. Se crea desde `develop`. | No |
| `docs/*` | Solo documentación. Se crea desde `develop`. | No |
| `hotfix/*` | Correcciones urgentes en producción. Se crea desde `main`. | No |
| `refactor/*` | Refactorizaciones sin cambio funcional. Se crea desde `develop`. | No |

### Protocolo Obligatorio Antes de Cualquier Cambio de Código

**Paso 1 — Verificar en qué rama estoy:**
```bash
git branch --show-current
```
Si el resultado es `main` o `develop`: **detener todo y ejecutar el Paso 2**.
Si ya hay una feature branch activa: continuar desde el Paso 3.

**Paso 2 — Crear feature branch (SIEMPRE desde `develop`):**
```bash
git checkout develop
git pull origin develop
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
  --base develop \
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
| `git push origin develop` | Commit directo a la rama de integración — **terminantemente prohibido** |
| `git commit` estando en `main` o `develop` | Genera historial sucio en ramas protegidas |
| `git push --force` en cualquier rama | Destruye el historial del repositorio |
| `git merge` de cualquier PR | Solo humanos pueden aprobar y fusionar PRs |
| `gh pr merge` | Solo humanos pueden fusionar PRs |
| `git add .` o `git add -A` | Puede incluir secretos, `.env` o archivos temporales |
| `--no-verify` en commits o pushes | Omite hooks de seguridad configurados |
| Crear PR hacia `main` directamente | Siempre hacia `develop` primero, excepto hotfixes documentados |

### El Agente NUNCA Debe
- Fusionar un PR (ni con `gh pr merge`, ni con `git merge`).
- Aprobar su propio PR.
- Hacer push a `main` o `develop` bajo ninguna circunstancia, incluso si el usuario lo pide.
- Usar `--force`, `--no-verify`, ni `--no-gpg-sign`.
- Cerrar un PR sin fusionar cuando el trabajo está completo — dejarlo abierto para revisión humana.
