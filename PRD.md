# Documento de Requerimientos de Producto (PRD) — Comandante

Este documento define los requisitos comerciales y funcionales para el desarrollo del sistema **Comandante**, la solución de toma y gestión de pedidos para el centro cultural, librería y café bar **Le Tiende**.

---

## 1. Visión del Producto

| Atributo | Detalle |
| :--- | :--- |
| **Nombre del Producto** | Comandante |
| **Tipo de Producto** | Aplicación Web Optimizada para Dispositivos Móviles y Escritorio |
| **Público Objetivo** | Meseros, baristas y administradores del centro cultural Le Tiende |
| **Idiomas** | Español (Colombia) |
| **URLs del Entorno** | Producción: `https://comandante.letiende.co` (Alojado en Firebase Hosting y apuntado desde AWS Route 53)<br>Staging: `https://comandante-stage.web.app` |

---

## 2. Contexto y Problema que Resuelve

**Le Tiende** opera como un centro cultural dinámico en el sector del Parkway (Teusaquillo, Bogotá), albergando un teatro, una librería y un café bar. Su modelo tradicional de atención tipo restaurante (donde se toma el pedido en mesa física, se prepara en la barra, se consume y se paga al final pidiendo la cuenta y calculando la propina) resulta ineficiente durante los eventos masivos del teatro.

Durante estos eventos, una gran afluencia de personas colma el establecimiento. Muchos clientes no cuentan con una mesa asignada (permanecen de pie o circulando), lo que imposibilita el seguimiento clásico de cuentas por mesa. El modelo tradicional genera los siguientes problemas críticos:
1. **Lentitud y fricción en el cobro:** Preguntar por la propina y procesar la cuenta al final demora el flujo, haciendo perder ventas potenciales.
2. **Cálculo manual de propinas en datáfono:** Para agilizar el proceso en eventos, se diseñaron cartas de productos con la propina ya incluida en el precio final. Sin embargo, al cobrar con el datáfono, el mesero debe separar manualmente el valor del producto (gravado con impuestos correspondientes) y el valor de la propina (exento de impuestos). Hacer estas cuentas mentalmente bajo presión de tiempo induce a errores contables y fiscales graves.
3. **Pérdida y desorden de comandas físicas:** Llevar papeles escritos a mano a la barra causa pérdidas de pedidos, retrasos y errores en el orden de preparación.

### Solución Propuesta (Modelo Discoteca)
Para eventos, el modelo debe cambiar a un esquema de cobro inmediato:
1. El mesero toma el pedido directamente desde su celular.
2. El mesero realiza el cobro de inmediato. Si el pago es con tarjeta, la aplicación le muestra exactamente qué valores ingresar en el datáfono para la propina y para el consumo de forma discriminada, eliminando cálculos mentales.
3. El pedido se envía digitalmente y al instante a una pantalla en la barra.
4. El barista prepara el pedido siguiendo el orden de llegada en la pantalla y marca cuando está listo.
5. El mesero recibe una notificación y entrega el pedido al cliente.
6. Al finalizar la jornada, el administrador descarga o visualiza un consolidado de ventas simplificado para ingresarlo al sistema POS general del establecimiento.

---

## 3. Usuarios y Audiencias

| Perfil de Usuario | Descripción y Rol | Necesidades Clave |
| :--- | :--- | :--- |
| **Mesero** | Personal de servicio en mesa y áreas comunes, opera desde su teléfono móvil. El rol de mesero es dinámico y asignado por el Administrador al inicio de la jornada. | - Interfaz táctil ágil y de carga rápida.<br>- Identificación rápida mediante palabras clave (ej. nombre del cliente) para cada pedido.<br>- Envío inmediato del pedido consolidado a la barra antes del pago.<br>- Cálculo automático e inmediato de la discriminación de propina para cobro en datáfono.<br>- Seguimiento en tiempo real del estado de preparación y de pago de sus pedidos. |
| **Barista** | Personal encargado de la barra y la cocina, opera desde una tableta o pantalla fija. El rol de barista es dinámico y asignado por el Administrador al inicio de la jornada. | - Cola de pedidos clara, organizada cronológicamente y clasificada por palabra clave (nombre de cliente).<br>- Capacidad para marcar productos específicos o pedidos completos como listos.<br>- Alertas visuales y sonoras de nuevos pedidos entrantes. |
| **Administrador** | Encargado general o propietario del centro cultural, opera desde un computador. El rol inicial se siembra con la cuenta `letiende.co@gmail.com`. | - Gestión del catálogo de productos y precios.<br>- Asignación dinámica de roles (Mesero, Barista o Administrador) al inicio de la jornada para usuarios autorizados.<br>- Crear o autorizar nuevos usuarios con rol de Administrador.<br>- Reporte consolidado de ventas diarias estructurado para el ingreso manual al POS. |

---

## 4. Objetivos del Producto

| Objetivo | Métrica de Éxito | Estado |
| :--- | :--- | :--- |
| **Eliminar el cálculo mental de propinas** | 100% de los pedidos cobrados con datáfono reflejan la separación exacta de base/impuesto y propina según las cartas oficiales. | Pendiente |
| **Reducir el tiempo de ciclo de pedido** | Menos de 45 segundos para que un pedido tomado por el mesero aparezca en la pantalla del barista. | Pendiente |
| **Cero comandas perdidas** | Eliminación completa de las comandas de papel en eventos, registizando el 100% de las ventas digitalmente. | Pendiente |
| **Simplificar el cuadre de caja diario** | El administrador puede generar el consolidado final en menos de 5 minutos al cierre de la jornada. | Pendiente |

---

## 5. Funcionalidades Actuales (Fase 1)

### 5.1. Módulo del Mesero (Vista Móvil)
- **Inicio de sesión y autenticación:** Acceso rápido mediante cuenta de Google autorizada.
- **Identificación del Pedido:** Campo de texto obligatorio para ingresar una palabra clave (típicamente el nombre del cliente) que identifique el pedido tanto para el mesero como para el barista.
- **Toma de pedidos ágil:** Lista visual de productos organizada por categorías de alta rotación (bebidas, licores, comida rápida). Selección mediante toques con sumatoria en tiempo real.
- **Consolidación y Envío Inmediato:** Botón para enviar la comanda directamente a la cola de preparación en barra, iniciando el proceso sin retrasos por el pago.
- **Pantalla de Cobro y Registro:** Una vez enviado el pedido, se activa la interfaz de pago. Si el pago es con tarjeta, la app muestra de manera destacada y en letras grandes la discriminación para el datáfono:
  - **Valor Consumo (Productos):** $XX.XXX
  - **Valor Propina:** $Y.YYY
  - **Total a Cobrar:** $ZZ.ZZZ
  Botón para confirmar que el cobro (efectivo o tarjeta) fue exitoso, actualizando el estado de pago del pedido en el sistema.
- **Monitoreo de Estado:** Listado de los pedidos del mesero actual, mostrando su estado de preparación (*En Preparación* / *Listo*) y su estado de cobro (*Pendiente* / *Pagado*).

#### Diagrama de flujo de toma de pedido:
```
[Inicio de Pedido] -> [Ingresar Nombre / Palabra Clave] -> [Seleccionar Productos]
                                                                  |
                                                         [Verificar Resumen]
                                                                  |
                                                     [Enviar Pedido a la Barra]
                                                  (Inicia preparación de inmediato)
                                                                  |
                                                     [Seleccionar Medio de Pago]
                                                     /                         \
                                            [Pago con Tarjeta]            [Pago en Efectivo]
                                                    |                              |
                                         [Mostrar Discriminación]          [Mostrar Total Neto]
                                         (Valor base vs Propina)                   |
                                                    |                              |
                                           [Registrar en Datáfono]                 |
                                                    \                              /
                                                 [Confirmar y Registrar Pago]
                                                                  |
                                                         [Pedido Pagado]
```

### 5.2. Módulo del Barista (Vista de Tableta/Pantalla)
- **Cola de Pedidos en Tiempo Real:** Lista de pedidos entrantes ordenados cronológicamente (los más antiguos primero). Cada comanda digital muestra:
  - Palabra clave (nombre del cliente) destacada y nombre del mesero.
  - Lista de productos y cantidades.
  - Tiempo transcurrido desde su solicitud.
  - Estado del pago (marcado como "Pendiente" o "Pagado") para el control de entrega.
- **Gestión de Preparación:** El barista puede marcar productos de forma individual como "preparados" (para pedidos grandes) o marcar la comanda completa como "Lista para entrega".
- **Notificación de Entrega:** Al marcar un pedido como listo, se notifica inmediatamente al mesero correspondiente en su dispositivo.

### 5.3. Módulo de Administración (Vista de Escritorio)
- **Control de Usuarios y Roles Dinámicos:**
  - Registro y autorización de cuentas de Gmail de colaboradores en la lista blanca de acceso.
  - Asignación dinámica de roles al inicio de la jornada: el administrador puede cambiar el rol activo de un usuario entre `Mesero` (waiter), `Barista` (barista) o `Administrador` (admin).
  - Autorización y creación de nuevos usuarios con rol de `Administrador`.
  - Cuenta inicial sembrada (Administrador Semilla): `letiende.co@gmail.com`.
- **Administración del Catálogo (Menú):** Crear, modificar y archivar productos. Cada producto define:
  - Nombre del producto.
  - Precio de venta al público (PVP) base.
  - Valor de la propina precalculada asociada al producto.
  - Precio total (PVP + Propina), que es el valor que visualiza el cliente en la carta especial de eventos.
- **Consolidado de Ventas:** Interfaz para seleccionar una fecha o jornada y generar un resumen estructurado que indica la sumatoria de productos vendidos y el total de propinas recaudadas, facilitando su inserción manual en el sistema POS del establecimiento.

---

## 6. Roadmap de Funcionalidades Futuras

| Funcionalidad | Descripción | Prioridad |
| :--- | :--- | :--- |
| **Integración directa con POS** | Conexión automática con el sistema de facturación POS de Le Tiende mediante API (cuando el proveedor habilite su API pública) para evitar el ingreso manual al final de la noche. | Alta |
| **Múltiples Datáfonos / Terminales** | Posibilidad de asignar a qué datáfono físico se cargó el pago para facilitar arqueos de caja independientes por terminal. | Media |
| **Historial de Desempeño y Estadísticas** | Gráficas para el administrador que muestran productos más vendidos por hora, ventas totales por mesero y tiempos promedio de preparación de la barra. | Media |
| **Control de Stock en Tiempo Real** | Descuento automático de inventario de insumos críticos (bebidas embotelladas, licores) y alerta visual al mesero cuando un producto se agota. | Baja |
| **Gestión y Reparto de Propinas** | Módulo para calcular la distribución equitativa de las propinas acumuladas entre el personal de servicio y barra de acuerdo con las horas trabajadas. | Baja |

---

## 7. Casos de Uso Principales

| Actor | Acción | Resultado Esperado |
| :--- | :--- | :--- |
| **Mesero** | Abre la aplicación en su móvil e inicia sesión. | La aplicación autentica su cuenta de Gmail contra la lista de usuarios permitidos y carga la pantalla de toma de pedidos con el menú actualizado. |
| **Mesero** | Ingresa la palabra clave "Carlos", selecciona 2 Cervezas y 1 Hamburguesa, y presiona "Enviar a Barra". | El sistema crea el pedido en estado "En Preparación" con pago "Pendiente". El pedido aparece al instante en la cola del barista bajo el nombre "Carlos" y se habilita la pantalla de cobro en el móvil del mesero. |
| **Mesero** | Procesa el pago con tarjeta del pedido de "Carlos", visualiza la discriminación en pantalla (Consumo: $45.000, Propina: $4.500) y presiona "Registrar Pago". | El sistema actualiza el estado de pago del pedido a "Pagado" en la base de datos. El mesero puede continuar atendiendo mientras la barra continúa la preparación. |
| **Barista** | Presiona "Listo" en la comanda digital del pedido de la mesa o cliente X. | El pedido desaparece de la lista activa del barista. En la pantalla del mesero correspondiente, el pedido pasa al estado "Listos para Entregar" y emite una alerta visual. |
| **Administrador** | Ingresa a la sección "Consolidado" al final de la jornada y selecciona la fecha actual. | El sistema genera una tabla resumen con el total de ingresos por productos y el total de propinas, además de un botón para exportar a CSV/JSON o ver el reporte resumido de inserción en POS. |

---

## 8. Requisitos No Funcionales

### 8.1. Rendimiento y Usabilidad
- **Tiempo de respuesta:** La sincronización de pedidos entre mesero y barista debe realizarse en tiempo real (latencia menor a 2 segundos).
- **Diseño Móvil-Primero:** La interfaz del mesero debe ser sumamente ligera, con botones grandes aptos para uso rápido con una sola mano en entornos con mucho movimiento y poca luz.
- **Consumo de datos y batería:** La aplicación debe estar optimizada para consumir la menor cantidad de batería y datos móviles posible, previendo jornadas de hasta 8 horas continuas.

### 8.2. Seguridad
- **Autenticación robusta:** Uso obligatorio de Firebase Authentication integrado con Google Sign-In.
- **Autorización a nivel de servidor:** Los datos y flujos de lectura/escritura en la base de datos deben estar protegidos mediante reglas de acceso estrictas vinculadas al rol del usuario autenticado.
- **Acceso restringido:** Únicamente los correos electrónicos previamente registrados por el Administrador en la lista blanca de la base de datos podrán iniciar sesión y consumir recursos.

### 8.3. Confiabilidad y Disponibilidad
- **Soporte de reconexión:** Si el mesero pierde momentáneamente la señal Wi-Fi o de datos en alguna zona del establecimiento, la aplicación debe retener la información localmente y sincronizar el pedido de inmediato cuando se restablezca la conexión.

---

## 9. Restricciones y Decisiones de Diseño

- **Cartas Especiales con Precios Fijos (Propina Incluida):** El menú en eventos no calcula propinas dinámicas porcentuales sugeridas. Los precios mostrados en el menú ya incluyen el valor absoluto de la propina predefinido para ese evento o producto. La app tiene la única tarea de realizar la *sustracción* contable para mostrarle la discriminación al mesero.
- **Ingreso POS Diferido:** Dado que actualmente no hay una API disponible para el POS físico de Le Tiende, no se requiere integración de facturación electrónica en tiempo real desde la aplicación. Las facturas oficiales del POS se emitirán al final del evento ingresando los totales agrupados generados en el consolidado de Comandante.
- **Límites de Infraestructura Sin Costo (Plan Spark de Firebase):** La aplicación debe estar técnicamente optimizada para operar estrictamente bajo los límites gratuitos mensuales y diarios de la capa gratuita (Spark Plan de Firebase). Ninguna característica o flujo debe inducir consumos que activen la facturación del plan Blaze.

---

## 10. Glosario de Negocio

- **Comanda:** El registro digital de un pedido de alimentos o bebidas realizado por un cliente, que se transfiere de los meseros a los baristas.
- **Datáfono:** Terminal de punto de venta (tarjeta de crédito/débito, POS terminal) utilizado en Colombia para procesar pagos electrónicos.
- **Propina (Exenta):** Suma de dinero voluntaria que el cliente otorga por el servicio. En la legislación tributaria colombiana, las propinas no forman parte de la base gravable del Impuesto Nacional al Consumo (INC) ni del IVA, por lo que es mandatorio cobrarlas y registrarlas de forma separada del valor de los productos consumidos.
- **POS (Point of Sale):** Sistema de caja registradora y facturación física principal del establecimiento Le Tiende donde se asienta la contabilidad y se emiten los tiquetes fiscales.
- **Barista:** Personal encargado de preparar café, cócteles, licores y comidas rápidas en la barra.
- **Parkway:** Sector del barrio La Soledad/Teusaquillo en Bogotá, caracterizado por ser un corredor cultural y comercial de alta afluencia.
