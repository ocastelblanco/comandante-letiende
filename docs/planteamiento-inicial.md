---
type: Note
---
# Planteamiento inicial

## Contexto

**Le Tiende** es un centro cultural que tiene un teatro, una librería y es, además, un café bar.

Está ubicado en el *Parkway*, en la localidad de Teusaquillo, una zona central de Bogotá, Colombia.

### Modelo de atención actual

**Le Tiende** atiende a sus clientes como un restaurante:

1. El mesero toma el pedido en la mesa, llenando una comanda.
2. Lleva la comanda con el pedido y se la entrega al barista.
3. El barista abre una mesa en el sistema POS con el pedido.
4. El barista prepara el pedido.
5. El mesero lleva el pedido a la mesa correspondiente.
6. El mesero toma pedidos adicionales en la mesa.
7. El mesero entrega la comanda con pedidos adicionales al barista.
8. El barista añade los pedidos adicionales a la mesa correspondiente en el sistema POS.
9. El barista prepara los pedidos adicionales.
10. El mesero lleva los pedidos adicionales a la mesa correspondiente.
11. El cliente solicita la cuenta al mesero.
12. El mesero pregunta si desea incluir la propina.
13. El mesero pide la cuenta al barista.
14. El barista genera la cuenta en el sistema POS, incluyendo la propina, si fue aceptada.
15. El mesero lleva la cuenta a la mesa.
16. Si el cliente paga con tarjeta, el mesero debe incluir, de manera separada en el datáfono, la propina y el valor de los productos consumidos.
17. El cliente paga la cuenta.

## Problemática

Debido a que los eventos que se realizan en el teatro citan muchísimas personas, muchas de las cuales ni siquiera están sentadas en una mesa, se requiere un mayor dinamismo al momento de comandar y cobrar los pedidos. Por lo tanto, el modelo de atención actual, tipo restaurante, tiene que cambiar.

Para estos casos, se busca implementar un modelo de atención tipo discoteca, en el que el cobro se haga inmediatamente luego del pedido, que debe prepararse de forma inmediata.

Como primera medida, debido a que no hay tiempo para que el cliente decida si se debe incluir o no la propina, se crearon unas cartas especiales que ya incluyen un valor de propina.

Pero al momento de registrar el pedido, el mesero no puede discriminar el valor del producto del de la propina, porque no puede hacer las cuentas mentalmente; esta discriminación es **absolutamente importante** al momento de registrar el cobro en el datáfono, ya que de esta forma se garantiza que los cobros de propina están excentos de impuestos.

Por otro lado, llevar pedidos en comandas a la barra es un problema, porque dichas comandas se pueden mezclar o perder y afectar el orden y la preparación de los pedidos.

### Propuesta de modelo de atención para eventos

1. El mesero toma el pedido.
2. El mesero cobra el pedido.
3. Si se paga con tarjeta, el mesero debe discriminar, en el datáfono, el valor de la propina y el valor del pedido.
4. El barista prepara el pedido.
5. El mesero lleva el pedido al cliente.
6. Al final de la noche se ingresan todos los pedidos en el sistema POS.

## Requerimiento

Desarrollar una solución llamada **Comandante** que ataque los problemas planteados:

1. Tomar un pedido, de forma rápida y eficiente, con los valores finales de propina y productos correctamente discriminados para el pago con datáfono.
2. Enviar los pedidos a la barra para su preparación inmediata.
3. Generar un consolidado de ventas, para su ingreso en el sistema POS.

### Descripción inicial de la solución

Una aplicación web con tres interfaces:

- Para el mesero:
  - Se usa desde un celular.
  - Toma pedidos de manera ágil y eficiente, y discrimina correctamente el valor final de los productos del valor final de la propina.
  - Envía el pedido, luego de consolidado, a la interfaz del barista.
  - El mesero puede consultar el estado de pedidos solicitados en proceso de preparacion.
- Para el barista:
  - Se usa desde una tableta o computador
  - Recibe y encola los pedidos del mesero.
  - Presenta los pedidos en orden cronologico.
  - El barista señala los productos ya preparados, listos para entrega.
  - Avisa al mesero cuando la preparación de un pedido se ha completado y está listo para entregar.
- Para el administrador:
  - Se usa desde un computador.
  - Añade, borra o edita los productos disponibles, con sus precios base y propina.
  - Genera un consolidado de ventas de una jornada, para su registro en el sistema POS.
  - Ingresa o elimina los usuarios que podrán usar las interfaces de mesero o barista.

### Stack tecnologíco inicial

|                |                    |                                                                                                    |
| -------------- | ------------------ | -------------------------------------------------------------------------------------------------- |
| **Componente** | **Tecnologia**     | **Descripción**                                                                                    |
| Frontend       | Angular / Firebase | Interfaces para mesero, barista y administador.                                                    |
| Autenticación  | Firebase           | Sistema de autenticación básico, basado en Gmail, para usuarios meseros, baristas y administrador. |
| Mensajería     | Firebase           | Sistema de envío de notificaciones entre interfaces de mesero y barista.                           |
| Backend        | Firebase           | Registro de pedidos, listado de productos y consolidado de ventas.                                 |
