# MEMORY.md — Memoria de Arquitectura y Estado de Comandante

Este documento mantiene el registro histórico del estado de desarrollo del proyecto, decisiones de arquitectura clave (ADRs) y configuraciones técnicas del sistema **Comandante**.

---

## 1. Estado Actual del Proyecto

| Parámetro | Detalle |
| :--- | :--- |
| **Versión Actual** | v0.1.0-alpha (Inicialización del Proyecto) |
| **Ramas Activas** | `develop` (integración), `main` (producción) |
| **Entorno de Staging** | *Pendiente por configurar en Firebase Console* |
| **Entorno de Prod** | *Pendiente por configurar en Firebase Console* |
| **Última Sesión** | 2026-05-22 — Creación de la documentación base de arquitectura y requerimientos. |

---

## 2. Funcionalidades Completadas vs. Pendientes

### Documentación y Planeación
- `[x]` Definición de Requerimientos de Producto (`PRD.md`)
- `[x]` Diseño de Especificaciones Técnicas (`tech-specs.md`)
- `[x]` Políticas de Seguridad OWASP y Git Flow (`CLAUDE.md`)
- `[x]` Memoria de Arquitectura Inicial (`MEMORY.md`)

### Infraestructura y Base
- `[ ]` Creación del proyecto en la consola de Firebase.
- `[ ]` Inicialización del repositorio y estructura de directorios Angular 21.2.x.
- `[ ]` Configuración de Tailwind CSS v4 e Ionic Framework en el frontend.
- `[ ]` Definición de Reglas de Seguridad en Cloud Firestore (`firestore.rules`).

### Módulo del Mesero (Vista Móvil)
- `[ ]` Autenticación con Google Sign-In e integración con lista blanca.
- `[ ]` Campo para ingresar palabra clave / nombre del cliente en cada pedido.
- `[ ]` Selector ágil de productos con cálculo contable automático (Consumo vs Propina).
- `[ ]` Envío inmediato de comandas a la barra para inicio de preparación antes del pago.
- `[ ]` Vista de cobro posterior y registro de pago (efectivo/tarjeta con discriminación).
- `[ ]` Listado en tiempo real de estados de pedidos ("En Preparación" / "Listo") y estado de pago.

### Módulo del Barista (Vista Barra)
- `[ ]` Cola digital cronológica de comandas entrantes identificadas por palabra clave/nombre del cliente.
- `[ ]` Gestión de preparación (marcar productos individuales o pedidos completos).
- `[ ]` Notificación reactiva de comanda lista hacia el mesero.

### Módulo del Administrador (Vista Escritorio)
- `[ ]` ABM (Crear, Leer, Actualizar, Borrar) de productos y asignación de propina fija.
- `[ ]` Control de usuarios (Gestión de lista blanca de correos autorizados y roles).
- `[ ]` Generador de consolidados diarios para migración manual al POS de Le Tiende.

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
*   **Estado:** Aprobado (Fase de Planeación)
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

---

## 4. Dependencias Instaladas (Teóricas Iniciales)

Estas dependencias serán instaladas durante la inicialización del proyecto:

| Paquete | Versión Esperada | Propósito |
| :--- | :--- | :--- |
| `@angular/core` | `^21.2.0` | Framework base de desarrollo |
| `@angular/fire` | `^21.2.0` | Integración oficial de Angular con el SDK de Firebase |
| `firebase` | `^10.12.0` | SDK de Firebase para Auth y Firestore |
| `@ionic/angular` | `^8.0.0` | Componentes visuales móviles |
| `tailwindcss` | `^4.0.0` | Utilidades de diseño rápido |

---

## 5. Configuraciones Vigentes
*Por definir una vez se inicialice el proyecto Firebase y se generen las credenciales del cliente.*

---

## 6. Patrones de Código Establecidos

### Consumo Reactivo de Pedidos con Signals (Ejemplo de Servicio)
```typescript
import { inject, Injectable, signal } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Order } from '@core/models/order.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private firestore = inject(Firestore);
  
  // Signal de estado interno
  private ordersSignal = signal<Order[]>([]);
  public readonly orders = this.ordersSignal.asReadonly();

  constructor() {
    const ordersRef = collection(this.firestore, 'orders');
    // Escucha en tiempo real de Firestore
    (collectionData(ordersRef, { idField: 'id' }) as Observable<Order[]>).subscribe(
      (data) => this.ordersSignal.set(data)
    );
  }
}
```

---

## 7. Gotchas Conocidos (Problemas Frecuentes)

| Situación | Causa | Solución Recomendada |
| :--- | :--- | :--- |
| Doble cobro o comandas duplicadas al presionar varias veces el botón de envío rápido. | Latencia de red móvil en el cliente mesero. | Deshabilitar el botón de confirmación de pago inmediatamente después del primer toque mediante un estado `isSubmitting` reactivo. |
| El mesero no recibe alertas visuales cuando un pedido pasa a "Listo". | La aplicación está en segundo plano o el dispositivo móvil apaga el socket por ahorro de energía. | Implementar notificaciones de vibración local o alertas persistentes en la barra de navegación usando las capacidades PWA de Ionic. |

---

## 8. Documentos de Referencia

| Archivo | Ruta | Propósito |
| :--- | :--- | :--- |
| **Planteamiento Inicial** | [planteamiento-inicial.md](file:///Users/ocastelblanco/Documents/LeTiende/letiende.co/comandante/planteamiento-inicial.md) | Documento original con las necesidades de Le Tiende. |
| **PRD** | [PRD.md](file:///Users/ocastelblanco/Documents/LeTiende/letiende.co/comandante/PRD.md) | Requisitos funcionales de producto y roadmap comercial. |
| **Tech Specs** | [tech-specs.md](file:///Users/ocastelblanco/Documents/LeTiende/letiende.co/comandante/tech-specs.md) | Especificación de la arquitectura de datos, flujos y stack. |
| **Claude rules** | [CLAUDE.md](file:///Users/ocastelblanco/Documents/LeTiende/letiende.co/comandante/CLAUDE.md) | Reglas permanentes de IA, seguridad y Git Flow. |

---

## 9. Contexto de la Sesión Actual

- **Qué se hizo hoy:**
  - Creación de la documentación base (`PRD.md`, `tech-specs.md`, `CLAUDE.md`, `MEMORY.md`, `TODO.md`).
  - Ajuste del flujo de toma de pedidos para permitir envío a barra inmediato antes de realizar el pago.
  - Adición de palabra clave (nombre del cliente) a los pedidos para una fácil identificación de comandas.
  - Ajustes de requerimientos para Angular 21.2.x, subdominio personalizado `comandante.letiende.co` en AWS Route 53, optimizaciones de costo cero bajo el plan Firebase Spark y roles dinámicos por jornada (administrador semilla: `letiende.co@gmail.com`).
- **Próxima Tarea Sugerida:** Inicializar el proyecto Angular 21.2.x mediante el CLI e integrar el SDK de Firebase en `app.config.ts`. Crear la rama `develop` en el repositorio antes de comenzar.
