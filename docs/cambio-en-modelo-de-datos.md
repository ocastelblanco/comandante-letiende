---
type: Note
_width: wide
---
# Cambio en modelo de datos

## Introducción

Debido a que la lista de productos de **Comandante** también se convertirá en la lista de precios de **letiende.co** y, además, servirá de fuente de datos para la carta física de **Le Tiende**, tenemos que hacer unos cambios en el modelo de datos de los productos que, a la vez, implicará cambios en el frontend.

Adicionalmente, haremos ajustes a la forma en la que se calcula la propina y cambiaremos la lista de medios de pago, lo que implica, también, cambios del modelo de datos y del frontend.

## Lista de productos de Comandante como fuente de verdad

La lista de productos de Le Tiende partirá ahora de un documento en **Google Sheets** que servirá de fuente de verdad de los productos y sus precios, compuesto por dos hojas: `datos` y `canva`.

Este documento será exportado por el `administrador` como XLSX y se cargará en **Comandante**; la aplicación almacenará, por lo tanto, la información de la hoja `datos`, con su nueva estructura. Esta información se hará pública a través del endpoint público `https://comandante.letiende.co/menu.json`, usando una estructura lista para ser procesada por **letiende.co**, por ejemplo:

```json
{
  "updatedAt": "2026-09-19T23:45:24.778Z",
  "items": [
      {
        "name": "Diosa",
        "description": null,
        "additions": [],
        "variants": [
          "sweet_stout",
          "amber_ale",
          "indian_pale_ale",
          "american_pale_ale"
        ],
        "category": "cervezas",
        "subcategory": "artesanales",
        "basePrice": 15200
      },
      {
        "name": "Capuchino",
        "description": null,
        "additions": [
          { "addition": "leche_vegetal", "additionPrice": 3500 },
          { "addition": "licor", "additionPrice": 8700 }
        ],
        "variants": [],
        "category": "bebidas",
        "subcategory": "de_cafe",
        "basePrice": 9900
      },
      {
        "name": "Margarita",
        "description": "Tequila, limón y licor de naranja, con un beso de sal.",
        "additions": [],
        "variants": [],
        "category": "cocteles",
        "subcategory": "clasicos",
        "basePrice": 29900
      }
    ]
}
```

### Hoja `datos`

Contiene un listado plano con los productos categorizados y sus precios, similar al siguiente:

| name | additions | variants | description | category | subcategory | basePrice | additionPrices | active |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Espresso simple | | | | bebidas | de_cafe | 6600 | | false |
| Espresso doble | | | | bebidas | de_cafe | 8800 | | false |
| Capuchino | leche_vegetal, licor | | | bebidas | de_cafe | 9900 | 3500, 8700 | false |
| Latte | leche_vegetal, licor | | | bebidas | de_cafe | 8400 | 3500, 8700 | false |
| Agua Hatsu | | sin_gas, con_gas | | bebidas | frias | 4700 | | true |
| Té Hatsu | | carambolo, granada, lyche, mangostino, mora | | bebidas | frias | 8200 | | false |
| Té matcha | leche, leche_vegetal | | | bebidas | calientes | 9300 | 1800, 5500 | false |
| Té chai | leche, leche_vegetal | | | bebidas | calientes | 9300 | 1800, 5300 | false |
| Margarita | | | Tequila, limón y licor de naranja, con un beso de sal. | cocteles | clasicos | 29900 | | true |
| Wake Up Call | | | Con vodka y lo mejor de nuestro café. | cocteles | de_autor | 29900 | | true |
| Dry Martini | | | Gin, vermouth y aceituna, la elegancia en su máxima expresión. | cocteles | premium | 32000 | | true |
| Club Colombia | | dorada, roja, negra | | cervezas | nacionales | 9400 | | true |
| Diosa | | sweet_stout, amber_ale, indian_pale_ale, american_pale_ale | | cervezas | artesanales | 15200 | | true |
| Stella Artois | | | | cervezas | importadas | 11800 | | true |
| Promo cocteles de autor | | | | ofertas | promociones | 42500 | | false |
| Promo cocteles clásicos | | | | ofertas | promociones | 42500 | | false |
| Nachos de plátano | | | Acompañados de suero costeño y guacamole de la casa. | comida | | 16900 | | true |
| Empanada de carne | | | | comida | | 2700 | | true |
| Torta de pistacho | | | | reposteria | | 18900 | | false |
| Glenlivet Caribbean botella | | | | licores | botella | 280000 | | true |
| Whisky 12 años | | buchannan's, chivas_regal | | licores | trago | 34000 | | true |

Esta tabla, que parte de la tabla original de productos de **Comandante**, tiene varios campos adicionales necesarios, tanto para la aplicación, como para la carta impresa y digital.

### Hoja `canva`

Es la hoja que se conectará con [Canva](https://canva.com) de forma dinámica, desde la que se tomarán los datos para la carta impresa, que podrá ser exportada como PDF.

Los nombres y precios de los productos en esta hoja se obtendrán, a través de fórmulas o de un script, de la hoja `datos`.

## Ajustes en los flujos de uso

En el caso de **Comandante** habrá un nuevo flujo de pedido para el `mesero`:

- Los productos ya no incluyen `tipAmount`, por lo que se calculará el 10% por defecto y el `mesero` podrá cambiar ese valor antes de cobrar el pedido.
- Solo se podrán añadir a un pedido los productos cuyo campo `active` sea `true`.
- Si un producto tiene `variants` será obligatorio seleccionar una de ellas; las `variants` no implican cambios de precio del producto.
- Si un producto tiene `additions` se podrán añadir una, varias, todas o ninguna. El precio de la adición o adiciones añadidas se sumará al precio base del producto.
- El `mesero` podrá hacer observaciones en cada **pedido**; estas observaciones están dirigidas al `barista` (también las podrá ver el `administrador`, por supuesto) y pueden ser cosas como "No añadir aceituna al Dry Martini".

### Flujo de pedido de `mesero`

**Nota:** Se indican con `(paso actual)` los pasos que se deben realizar como se hacen actualmente, o `(paso nuevo)` los que implican modificaciones o adiciones al flujo existente.

1. `sistema` solo visualiza los productos cuyo campo `active` sea `true`. (paso nuevo)
2. `mesero` crea un pedido. (paso actual)
3. `mesero` identifica el pedido con un nombre (por ejemplo, la mesa o el cliente). (paso actual)
4. `mesero` hace clic en **Añadir producto** y busca y selecciona un producto. (paso actual)
5. `sistema` añade un botón **+ Adición** a la *card* del producto, si el producto tiene contenido en el campo `additions`. (paso nuevo)
6. `sistema` añade un botón **+ Variante** a la *card* del producto, si el producto tiene contenido en el campo `variants`. (paso nuevo)
7. Si el producto tiene variantes (`variants`), `mesero` **debe** hacer clic sobre el botón **+ Variante** y `sistema` abrirá un diálogo con las opciones de `variants`, y `mesero` deberá seleccionar **solo una** de ellas. (paso nuevo)
8. Si el producto tiene adiciones (`additions`), `mesero` **puede** hacer clic sobre el botón **+ Adición** y `sistema` abrirá un diálogo con las opciones de `additions`, y `mesero` podrá seleccionar **todas** las que desee. (paso nuevo)
9. Si necesita añadir más productos, `mesero` repite las acciones desde el paso 4. (paso actual)
10. `sistema` visualiza en la *card* **Resumen**: (paso nuevo)
    - Cada producto seleccionado, con su precio base (`basePrice`).
    - Un *textarea* con label **Observaciones**, donde `mesero` podrá escribir algún texto.
    - Subtotal: suma de los precios base (`basePrice`) de todos los productos del pedido.
    - Propina: el 10% del subtotal, por defecto.
    - Al lado del valor de la propina, un botón (ícono de lápiz) para editar el valor de la propina.
    - Total a cobrar.
11. `mesero` hace clic en el botón de editar propina. (paso nuevo)
12. `sistema` genera un diálogo con dos campos tipo *input* de número, que se suman y determinan el valor final de la propina: (paso nuevo)
    - **Porcentaje**: 10 por defecto, es un valor porcentual sobre el subtotal del pedido.
    - **Valor**: 0 por defecto, es un valor absoluto.
13. Al terminar de añadir todos los productos solicitados, `mesero` hace clic en **Realizar pedido**. (paso actual)
14. `mesero` hace clic en la *card* del pedido y `sistema` despliega las mismas opciones del paso 10; lo que implica que `mesero` puede realizar los pasos 11 y 12. (paso nuevo)
15. A partir de la información del pedido: (paso nuevo)
    - Si el pago es con datáfono, `mesero` digita la información en el datáfono.
    - Si el pago es con QR, `mesero` le indica al cliente el valor de la propina y el valor de los productos.
16. `mesero` hace clic en **Cobrar** y `sistema` despliega la lista de medios de pago: (paso nuevo)
    - **Datáfono**
    - **QR**: **Le Tiende** adquirió un sistema de cobro por QR (SonoQR de Bold), que agrupa los pagos de billeteras virtuales (Nequi, Daviplata, etc.) y las transferencias electrónicas.
    - **Efectivo**
17. `mesero` hace clic en la opción deseada. (paso actual)

Luego de finalizar la fase de **pedido**, el resto del flujo de `mesero` se mantiene como está actualmente.

### Ajuste en interfaz de `barista` y `administrador`

En la *card* de cada pedido debe aparecer la **Observación** que hizo el `mesero`.

---

## Decisiones tomadas (2026-09-19)

Acordadas con el dueño del proyecto antes de planificar la implementación. Se registran aquí para que el documento quede autocontenido.

| Tema | Decisión | Razón |
| :--- | :--- | :--- |
| **Ortografía de `additions`** | Se usa `additions` / `addition` / `additionPrice` / `additionPrices`, con doble `d`. | La primera versión de este documento traía un error de ortografía (`aditions`). `CLAUDE.md` §4 exige código en inglés; el nombre viaja al modelo, a Firestore, a la columna del Excel y al contrato público, así que se corrige antes de implementar. **La hoja `datos` del Google Sheets debe renombrar sus columnas en consecuencia.** |
| **Compatibilidad de `/menu.json`** | Se reemplaza el contrato actual sin capa de compatibilidad hacia atrás. | El endpoint existe desde la Tarea 27 y emite `totalPrice`, pero **letiende.co todavía no lo consume**. Mantener el campo viejo solo dejaría deuda. |
| **Datos existentes** | Se limpian productos y pedidos de Firestore y se recarga el catálogo desde el Excel. Sin scripts de migración. | Comandante aún no se ha estrenado en operación real: todo lo que hay en producción son pruebas. Esto además absorbe la reclasificación manual de los 116 productos que quedó pendiente de la Tarea 27. |
| **Comportamiento del importador** | Sigue siendo *upsert*: crea y actualiza, pero **no archiva** los productos que desaparezcan de la hoja. | Decisión explícita, no omisión. Para retirar un producto se archiva desde Comandante o se recarga el catálogo completo. |
| **Campo `active`** | La columna del Excel se llama `active`, pero en el modelo y en Firestore se sigue llamando `isActive`. | Evita tocar la Cloud Function y el servicio de productos sin ganancia real, y respeta la convención habitual de TypeScript para booleanos. |
| **Edición después de *Realizar pedido*** | El mesero solo puede editar la **propina**, y solo mientras el pedido no esté cobrado (`paid == false`). | Es lo que pide el paso 14 de este documento y lo más seguro: un pedido ya cobrado queda inmutable, y el barista puede estar preparándolo. |
| **Entrega** | Tres tareas y tres Pull Requests independientes (Tareas 29, 30 y 31 en `TODO.md`). | Cada fase queda desplegable por separado, sin estados intermedios en los que el importador escriba un modelo que el mesero todavía no sepa leer. |

### Cálculo de la propina

La propina del pedido es `Math.round(subtotal × tipPercentage ÷ 100) + tipValue`, donde `tipPercentage` vale 10 y `tipValue` vale 0 por defecto. El redondeo es necesario porque el peso colombiano no maneja centavos.
