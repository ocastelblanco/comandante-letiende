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
- **Identificación del Pedido:** Campo de texto obligatorio para ingresar una palabra clave (típicamente el nombre del cliente o la mesa) que identifique el pedido tanto para el mesero como para el barista.
- **Toma de pedidos ágil:** Buscador de productos con sumatoria en tiempo real. Solo se ofrecen los productos activos del catálogo.
- **Variantes obligatorias:** Si un producto define variantes (por ejemplo, una cerveza artesanal con cuatro estilos, o un té con cinco sabores), el mesero **debe** elegir exactamente una antes de poder enviar el pedido. Las variantes no modifican el precio.
- **Adiciones opcionales:** Si un producto define adiciones (leche vegetal, licor, etc.), el mesero puede agregar ninguna, una o varias. Cada adición suma su propio valor al precio base del producto.
- **Observaciones para la barra:** Campo de texto libre por pedido, dirigido al barista, para instrucciones del cliente ("sin aceituna en el Dry Martini"). Visible también para el administrador.
- **Consolidación y Envío Inmediato:** Botón para enviar la comanda directamente a la cola de preparación en barra, iniciando el proceso sin retrasos por el pago.
- **Propina calculada y editable:** El resumen del pedido muestra subtotal, propina y total a cobrar. La propina se calcula por defecto como el **10 % del subtotal** y el mesero puede ajustarla antes de cobrar mediante un diálogo con dos campos que se suman: un **porcentaje** sobre el subtotal y un **valor absoluto**. La propina sigue siendo editable después de enviar el pedido a la barra, mientras no se haya cobrado.
- **Pantalla de Cobro y Registro:** La app muestra de forma destacada la discriminación necesaria para el datáfono:
  - **Valor Consumo (Productos):** $XX.XXX
  - **Valor Propina:** $Y.YYY
  - **Total a Cobrar:** $ZZ.ZZZ

  El mesero selecciona el medio de pago entre **Datáfono**, **QR** (SonoQR de Bold, que agrupa billeteras virtuales y transferencias) y **Efectivo**, y confirma el cobro.
- **Monitoreo de Estado:** Listado de los pedidos del mesero actual, mostrando su estado de preparación (*En Preparación* / *Listo*) y su estado de cobro (*Pendiente* / *Pagado*).

#### Diagrama de flujo de toma de pedido:
```
[Inicio de Pedido] -> [Ingresar Nombre / Palabra Clave] -> [Seleccionar Productos]
                                                                  |
                                              [Elegir Variante (obligatoria si aplica)]
                                              [Elegir Adiciones (opcionales, suman precio)]
                                                                  |
                                                    [Escribir Observaciones]
                                                                  |
                                     [Verificar Resumen: Subtotal / Propina 10% / Total]
                                                                  |
                                                     [Enviar Pedido a la Barra]
                                                  (Inicia preparación de inmediato)
                                                                  |
                                              [Ajustar Propina (opcional, si no se ha cobrado)]
                                                                  |
                                                     [Seleccionar Medio de Pago]
                                        /                         |                        \
                                 [Datáfono]                    [QR]                   [Efectivo]
                                        |                         |                         |
                            [Mostrar Discriminación]   [Indicar al cliente        [Mostrar Total Neto]
                            (Consumo vs Propina)        consumo y propina]                  |
                                        |                         |                         |
                             [Registrar en Datáfono]     [Cliente escanea]                  |
                                        \                        |                         /
                                                 [Confirmar y Registrar Pago]
                                                                  |
                                                         [Pedido Pagado]
```

### 5.2. Módulo del Barista (Vista de Tableta/Pantalla)
- **Cola de Pedidos en Tiempo Real:** Lista de pedidos entrantes ordenados cronológicamente (los más antiguos primero). Cada comanda digital muestra:
  - Palabra clave (nombre del cliente) destacada y nombre del mesero.
  - Lista de productos y cantidades, con la variante elegida y las adiciones de cada uno.
  - **Observaciones** escritas por el mesero, cuando las haya.
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
  - Descripción (para la carta impresa y la carta digital del sitio público).
  - Categoría y subcategoría, dentro de una jerarquía cerrada de 7 categorías raíz.
  - Precio de venta al público (PVP) base, **sin propina**.
  - Variantes disponibles (estilos, sabores, presentaciones), que no alteran el precio.
  - Adiciones disponibles con su costo individual, que sí se suman al precio.
  - Estado activo o archivado: solo los activos se ofrecen al mesero y se publican en la carta.
- **Carga del Catálogo desde Google Sheets:** La fuente de verdad del catálogo es un documento de Google Sheets. El administrador lo exporta como XLSX y lo carga en Comandante, que valida todas las filas antes de escribir nada: si alguna fila tiene una categoría inválida o precios inconsistentes, se rechaza la importación completa y se listan los errores. También puede descargar una plantilla con el formato correcto.
- **Publicación de la Carta:** El catálogo activo se expone como un endpoint público (`/menu.json`) que alimenta la lista de precios del sitio **letiende.co**. Una segunda hoja del mismo documento de Google Sheets alimenta la carta impresa a través de Canva.
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
| **Mesero** | Ingresa la palabra clave "Carlos", selecciona 2 Cervezas Diosa (eligiendo el estilo *Amber Ale*), 1 Capuchino con leche vegetal, anota "el capuchino sin azúcar" y presiona "Enviar a Barra". | El sistema exige elegir el estilo de la cerveza antes de permitir el envío, suma el costo de la leche vegetal al precio del capuchino, calcula una propina del 10 % sobre el subtotal y crea el pedido en estado "En Preparación" con pago "Pendiente". El pedido aparece al instante en la cola del barista bajo el nombre "Carlos", con la variante, la adición y la observación visibles. |
| **Mesero** | El cliente de "Carlos" pide dejar $6.000 de propina en vez del 10 % sugerido. El mesero toca el lápiz junto a la propina, pone el porcentaje en 0 y el valor en 6.000. | El sistema recalcula el total del pedido con la propina nueva. El cambio se permite porque el pedido aún no está cobrado; una vez cobrado, la propina queda bloqueada. |
| **Mesero** | Procesa el pago con datáfono del pedido de "Carlos", visualiza la discriminación en pantalla (Consumo: $45.000, Propina: $6.000) y presiona "Registrar Pago". | El sistema actualiza el estado de pago del pedido a "Pagado" y guarda el medio de pago usado. El mesero puede continuar atendiendo mientras la barra continúa la preparación. |
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

- **Precios de Carta sin Propina, Propina Calculada en el Pedido:** La carta muestra el precio real del producto, sin propina embebida. La propina se calcula sobre el pedido completo como un porcentaje sugerido del 10 %, que el mesero puede ajustar (por porcentaje, por valor absoluto o por ambos) antes de cobrar. La app realiza la *suma* contable y muestra la discriminación al mesero para el datáfono.

  > Esta decisión **reemplaza** a la política original de "cartas especiales con precios fijos con propina incluida", vigente hasta septiembre de 2026 (ver ADR-003 y ADR-006 en `MEMORY.md`). El motivo del cambio es que el catálogo dejó de ser solo el menú interno del punto de venta: ahora también es la lista de precios pública de letiende.co y la fuente de la carta impresa. Publicar un precio con una propina ya incluida es incorrecto en una carta de cara al cliente, porque la propina es voluntaria por ley.

- **Catálogo como Fuente de Verdad Compartida:** El catálogo de productos alimenta simultáneamente tres destinos: el punto de venta, la lista de precios de **letiende.co** (a través del endpoint público `/menu.json`) y la carta impresa (a través de una hoja de Google Sheets conectada a Canva). Su origen es un único documento de Google Sheets que el administrador exporta y carga en Comandante.
- **Ingreso POS Diferido:** Dado que actualmente no hay una API disponible para el POS físico de Le Tiende, no se requiere integración de facturación electrónica en tiempo real desde la aplicación. Las facturas oficiales del POS se emitirán al final del evento ingresando los totales agrupados generados en el consolidado de Comandante.
- **Límites de Infraestructura Sin Costo (Plan Spark de Firebase):** La aplicación debe estar técnicamente optimizada para operar estrictamente bajo los límites gratuitos mensuales y diarios de la capa gratuita (Spark Plan de Firebase). Ninguna característica o flujo debe inducir consumos que activen la facturación del plan Blaze.

---

## 10. Glosario de Negocio

- **Comanda:** El registro digital de un pedido de alimentos o bebidas realizado por un cliente, que se transfiere de los meseros a los baristas.
- **Datáfono:** Terminal de punto de venta (tarjeta de crédito/débito, POS terminal) utilizado en Colombia para procesar pagos electrónicos.
- **Propina (Exenta):** Suma de dinero voluntaria que el cliente otorga por el servicio. En la legislación tributaria colombiana, las propinas no forman parte de la base gravable del Impuesto Nacional al Consumo (INC) ni del IVA, por lo que es mandatorio cobrarlas y registrarlas de forma separada del valor de los productos consumidos.
- **POS (Point of Sale):** Sistema de caja registradora y facturación física principal del establecimiento Le Tiende donde se asienta la contabilidad y se emiten los tiquetes fiscales.
- **Barista:** Personal encargado de preparar café, cocteles, licores y comidas rápidas en la barra.
- **Variante:** Opción excluyente de un mismo producto que no altera su precio: el estilo de una cerveza artesanal, el sabor de un té, la presentación con o sin gas de un agua. Si un producto tiene variantes, elegir una es obligatorio.
- **Adición:** Extra opcional que se suma al precio base de un producto, como leche vegetal en un capuchino o un licor en un café. Un producto puede llevar varias.
- **SonoQR (Bold):** Sistema de cobro por código QR adquirido por Le Tiende, que agrupa en un solo medio de pago las billeteras virtuales (Nequi, Daviplata y otras) y las transferencias electrónicas. En Comandante corresponde al medio de pago **QR**.
- **Carta digital:** Versión pública del catálogo publicada en letiende.co, alimentada por el endpoint `/menu.json` de Comandante.
- **Parkway:** Sector del barrio La Soledad/Teusaquillo en Bogotá, caracterizado por ser un corredor cultural y comercial de alta afluencia.
