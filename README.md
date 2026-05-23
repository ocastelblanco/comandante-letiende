# Comandante — Sistema de Gestión de Pedidos para Le Tiende

**Comandante** es una solución web de toma rápida de pedidos, cálculo contable de propinas y cola digital de preparación en barra, diseñada a medida para el centro cultural, librería y café bar **Le Tiende** (Bogotá, Colombia).

El sistema opera con **costo de infraestructura cero** sobre el plan gratuito de Firebase y fue diseñado y orquestado íntegramente mediante agentes de IA especializados.

---

## Funcionalidades

### Para Meseros — Mobile First
Interfaz táctil ultraligera optimizada para celular. Permite seleccionar productos del catálogo, asignar una palabra clave al cliente y consolidar la comanda con un solo gesto. Diseñada para operar en condiciones de eventos masivos con iluminación baja y alta demanda.

### Cálculo de Propina y Cobro Discriminado
El sistema calcula y muestra en pantalla completa los montos separados de **consumo gravado** y **propina voluntaria** (exenta de IVA), facilitando el ingreso manual en datáfonos sin integración de API. Elimina errores humanos en el cobro y reduce fricciones contables.

### Sincronización en Tiempo Real
Las comandas consolidadas se transmiten instantáneamente a la barra vía Cloud Firestore. La preparación inicia antes de confirmar el pago — crítico en eventos tipo "discoteca" donde el flujo de caja es continuo.

### Cola de Comandas para Baristas — Tablet
Vista cronológica de pedidos en preparación, identificados por mesero y palabra clave. El barista controla la entrega y el estado del pago desde una pantalla dedicada sin depender de papel ni de comunicación verbal.

### Consolidado POS para Administradores — Desktop
Generador de resúmenes de ventas diarias estructurados para el asentamiento contable manual en el sistema POS del establecimiento. Exportable al cierre de cada jornada.

### Roles Dinámicos por Jornada
Autenticación con Google Sign-In mediante lista blanca de cuentas autorizadas. El administrador asigna y rota los roles (*Mesero*, *Barista*, *Administrador*) al inicio de cada turno sin tocar código ni configuración.

---

## Arquitectura de Costo Cero

El sistema corre íntegramente sobre el **plan Spark (gratuito) de Firebase**, sin servidor propio, sin instancias activas y sin costo mensual recurrente.

| Servicio | Plan | Costo mensual |
| :--- | :--- | :--- |
| Firebase Hosting | Spark | $0 |
| Cloud Firestore | Spark — 50 K lecturas / día | $0 |
| Firebase Authentication | Spark — 10 K verificaciones / mes | $0 |
| Dominio (`comandante.letiende.co`) | DNS en AWS Route 53 | ~$0.50 USD |

**Por qué esta elección es una decisión de arquitectura, no solo de presupuesto:**

- **Sin gestión de infraestructura.** No hay servidores, contenedores ni pipelines de deployment complejos. Firebase Hosting distribuye la SPA desde CDN global automáticamente.
- **Escalabilidad reactiva.** Firestore escala con el tráfico; en días sin eventos el costo es literalmente cero — no hay recursos "idle" pagando.
- **Seguridad en el perímetro correcto.** Las Firestore Security Rules son el único control de acceso real. Los guards de Angular son solo UX. Esto elimina la superficie de ataque de un backend intermedio.
- **Cuota diaria como techo de gasto.** La cuota gratuita (50 K lecturas/día) actúa como circuit breaker natural contra explosiones de consumo.

---

## Stack Tecnológico

| Capa | Tecnología |
| :--- | :--- |
| Framework Frontend | Angular 21.2.x — Standalone Components, Signals, Router |
| UI Mobile | Ionic Framework (Angular) 8.x |
| Estilos | Tailwind CSS 4.x |
| Base de Datos / Tiempo Real | Cloud Firestore (Firebase SDK v10+) |
| Autenticación | Firebase Authentication — Google Sign-In |
| Hosting / CDN | Firebase Hosting |
| DNS | AWS Route 53 |

---

## Orquestación con IA

Comandante no fue construido con IA como asistente de autocompletado — fue **orquestado** con agentes especializados como método principal de producción.

El flujo de trabajo utilizó **Claude Code** con equipos de agentes en paralelo para:

- **Análisis de requisitos** con entrevistas estructuradas al operador del negocio.
- **Diseño de arquitectura** con validación iterativa contra restricciones de costo y operación.
- **Especificación técnica** (`PRD.md`, `tech-specs.md`) generada y mantenida por agentes documentadores.
- **Implementación** delegada a agentes ejecutores con verificación por agentes revisores independientes.
- **Git flow** aplicado automáticamente — los agentes tienen prohibido hacer push a ramas protegidas.

Este repositorio es evidencia de que un arquitecto de soluciones con metodología *AI-first* puede diseñar, especificar y construir un sistema de producción completo, con restricciones reales de costo y seguridad, en una fracción del tiempo convencional.

---

## Documentación del Proyecto

| Documento | Contenido |
| :--- | :--- |
| [`PRD.md`](./PRD.md) | Visión del producto, perfiles de usuario, casos de uso y objetivos comerciales |
| [`tech-specs.md`](./tech-specs.md) | Arquitectura Firestore, configuración DNS, reglas de seguridad |
| [`CLAUDE.md`](./CLAUDE.md) | Instrucciones permanentes para agentes IA: código, seguridad y git flow |
| [`TODO.md`](./TODO.md) | Backlog JIT — las dos próximas tareas atómicas de desarrollo |
