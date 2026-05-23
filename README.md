# Comandante — Sistema de Gestión de Pedidos de Le Tiende

**Comandante** es la solución de toma rápida de pedidos, cálculo contable de propinas y cola digital de preparación en barra diseñada a medida para el centro cultural, librería y café bar **Le Tiende** (Bogotá, Colombia).

El sistema está optimizado para eventos masivos en el teatro de Le Tiende, permitiendo una transición fluida al modelo de atención tipo "discoteca" (cobro y preparación inmediata).

---

## 🚀 Características Clave

-   📱 **Mobile-First para Meseros:** Interfaz táctil ultraligera para dispositivos móviles que permite la selección ágil de productos y la asignación de palabras clave (nombre del cliente) para cada comanda.
-   💸 **Cálculo de Propina Fija y Cobro Discriminado:** Visualización en letras grandes de los valores separados de consumo (gravado) y propina (exenta de impuestos) para facilitar el ingreso manual en el datáfono.
-   ⚡ **Sincronización en Tiempo Real:** Envío instantáneo de comandas a la barra una vez consolidadas para iniciar la preparación antes de confirmar el pago.
-   ☕ **Cola de Comandas para Baristas:** Vista cronológica para tabletas que muestra los pedidos en preparación, identificados por mesero y palabra clave, controlando la entrega y el estado del pago.
-   📊 **Consolidado POS para Administradores:** Generador de resúmenes de ventas diarias estructurados para el asentamiento contable manual en el sistema POS del establecimiento.
-   🛡️ **Acceso Restringido y Roles Dinámicos:** Autenticación con Google Sign-In mediante lista blanca de Gmail. El administrador asigna y rota dinámicamente los roles (*Mesero*, *Barista*, *Administrador*) de los colaboradores al inicio de cada jornada.

---

## 🛠️ Stack Tecnológico

-   **Frontend:** [Angular 21.2.x](https://angular.dev) (Signals, Standalone Components, Router)
-   **Componentes de UI Móvil:** [Ionic Framework (Angular) 8.x](https://ionicframework.com/docs)
-   **Estilos:** [Tailwind CSS 4.x](https://tailwindcss.com)
-   **Base de Datos / Tiempo Real:** [Cloud Firestore](https://firebase.google.com/docs/firestore) (Firebase SDK v10+)
-   **Autenticación:** [Firebase Authentication](https://firebase.google.com/docs/auth) (Google Sign-In)
-   **Alojamiento / Despliegue:** [Firebase Hosting](https://firebase.google.com/docs/hosting) (Plan Spark - Capa 100% gratuita)

---

## 📖 Documentación Especializada

Para comprender la arquitectura y los detalles del proyecto, consulta los siguientes documentos en la raíz del repositorio:

*   📄 **[PRD.md (Requerimientos de Producto)](file:///Users/ocastelblanco/Documents/LeTiende/letiende.co/comandante/PRD.md):** Visión del producto, casos de uso, perfiles de usuario, objetivos comerciales e histórico de requerimientos.
*   📄 **[tech-specs.md (Especificaciones Técnicas)](file:///Users/ocastelblanco/Documents/LeTiende/letiende.co/comandante/tech-specs.md):** Diagrama de arquitectura, estructura de base de datos Firestore, configuración de dominio en AWS Route 53 e integración de seguridad.
*   📄 **[CLAUDE.md (Instrucciones permanentes de IA)](file:///Users/ocastelblanco/Documents/LeTiende/letiende.co/comandante/CLAUDE.md):** Comandos frecuentes, estándares de código, guías de seguridad OWASP y flujo de Git obligatorio.
*   📄 **[MEMORY.md (Memoria del proyecto)](file:///Users/ocastelblanco/Documents/LeTiende/letiende.co/comandante/MEMORY.md):** Registro de Decisiones de Arquitectura (ADRs), checklists de features y dependencias.
*   📄 **[TODO.md (Planificación JIT)](file:///Users/ocastelblanco/Documents/LeTiende/letiende.co/comandante/TODO.md):** Motor Just-In-Time con las siguientes dos tareas atómicas de desarrollo.

---

## 💻 Desarrollo Local

### Requisitos Previos
1.  Node.js (versión 20 o superior recomendada).
2.  Angular CLI instalado de forma global (`npm install -g @angular/cli`).

### Instalación y Ejecución
1.  Clonar el repositorio.
2.  Instalar dependencias:
    ```bash
    npm install
    ```
3.  Iniciar el servidor de desarrollo local:
    ```bash
    npm run start
    ```
4.  Abrir en el navegador `http://localhost:4200`.

### Despliegue
-   Para desplegar en el ambiente de Staging:
    ```bash
    npm run deploy:stage
    ```
-   Para desplegar en Producción (`https://comandante.letiende.co`):
    ```bash
    npm run deploy:prod
    ```
