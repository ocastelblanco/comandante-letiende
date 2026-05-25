---
version: alpha
name: Comandante — Le Tiende
description: Sistema de diseño para la app de toma de pedidos del centro cultural Le Tiende (Bogotá). Mobile-first para meseros, tablet para baristas, desktop para administrador.
colors:
  primary: "#230C00"
  secondary: "#E8630A"
  tertiary: "#00B7A3"
  neutral: "#FFE7B3"
  on-secondary: "#230C00"
  on-tertiary: "#230C00"
  surface: "#FFFFFF"
  surface-variant: "#FFE7B3"
  error: "#C0392B"
  on-error: "#FFFFFF"
typography:
  brand:
    fontFamily: Angellya
    fontSize: 2rem
    fontWeight: 400
    lineHeight: 1.2
  h1:
    fontFamily: Poppins
    fontSize: 1.5rem
    fontWeight: 700
    lineHeight: 1.3
  h2:
    fontFamily: Poppins
    fontSize: 1.25rem
    fontWeight: 600
    lineHeight: 1.4
  h3:
    fontFamily: Poppins
    fontSize: 1.125rem
    fontWeight: 600
    lineHeight: 1.4
  body-md:
    fontFamily: Poppins
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: Poppins
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: Poppins
    fontSize: 0.75rem
    fontWeight: 600
    letterSpacing: 0.05em
    lineHeight: 1
  price:
    fontFamily: Poppins
    fontSize: 1.25rem
    fontWeight: 700
    lineHeight: 1
rounded:
  sm: 8px
  md: 16px
  lg: 24px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
components:
  button-primary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-secondary}"
    rounded: "{rounded.md}"
    padding: 12px 24px
    height: 48px
  button-primary-disabled:
    backgroundColor: "#C4C4C4"
    textColor: "#474747"
    rounded: "{rounded.md}"
    height: 48px
  button-secondary:
    backgroundColor: transparent
    textColor: "{colors.secondary}"
    rounded: "{rounded.md}"
    padding: 12px 24px
    height: 48px
  button-destructive:
    backgroundColor: "{colors.error}"
    textColor: "{colors.on-error}"
    rounded: "{rounded.md}"
    padding: 12px 24px
    height: 48px
  chip-category:
    backgroundColor: "{colors.surface-variant}"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    padding: 8px 16px
  chip-category-active:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-secondary}"
    rounded: "{rounded.full}"
    padding: 8px 16px
  badge-pending:
    backgroundColor: "{colors.surface-variant}"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    padding: 4px 12px
  badge-preparing:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-secondary}"
    rounded: "{rounded.full}"
    padding: 4px 12px
  badge-ready:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-tertiary}"
    rounded: "{rounded.full}"
    padding: 4px 12px
  card-product:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: 16px
  card-order:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: 16px
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.sm}"
    padding: 14px 16px
    height: 48px
  quantity-stepper:
    backgroundColor: "{colors.surface-variant}"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    height: 36px
    width: 36px
  cart-summary-bar:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-secondary}"
    height: 64px
    rounded: 16px 16px 0 0
  tip-chip:
    backgroundColor: "{colors.surface-variant}"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    padding: 8px 16px
  tip-chip-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.full}"
    padding: 8px 16px
  top-toolbar:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral}"
    height: 56px
  bottom-nav:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral}"
    height: 64px
---

## Overview

**Comandante** es la aplicación interna de Le Tiende, centro cultural con café en Bogotá, Colombia. El nombre evoca el rol de quien coordina el servicio — el mesero que toma el pedido, el barista que lo prepara, el administrador que lo consolida.

La identidad visual de Comandante hereda directamente el manual de marca de Le Tiende: colores cálidos enraizados en la cultura del café de la región — el marrón profundo del grano tostado, el naranja de la cereza de café madura, la crema de la leche espumada — contrastados con el turquesa vital de la marca. La tipografía combina la caligrafía orgánica de **Angellya** (reservada para el nombre de marca) con la claridad moderna de **Poppins** para toda la interfaz funcional.

### Audiencias y dispositivos

| Rol | Dispositivo | Viewport base | Contexto de uso |
|-----|-------------|---------------|-----------------|
| Mesero | Smartphone | ≥ 360 px | En movimiento entre mesas, una mano libre |
| Barista | Tablet | ≥ 768 px | Barra, distancia de lectura ~60 cm |
| Administrador | Desktop | ≥ 1280 px | Escritorio, análisis pausado |

La vista de mesero es el núcleo del sistema. Todo el diseño parte de la pantalla más pequeña y escala hacia arriba. Nunca al revés.

## Colors

La paleta de cuatro colores de Le Tiende se usa sin alteración.

- **Primary (`#230C00`):** Marrón café ultra-oscuro. Base de toolbars, navegación inferior y texto de alta jerarquía. Evoca el grano de café tostado oscuro de la región andina.
- **Secondary (`#E8630A`):** Naranja Le Tiende. La acción principal. Botones CTA, indicadores de carrito activo, tab seleccionado. El color más energético de la paleta — se usa con disciplina para señalizar "haz clic aquí".
- **Tertiary (`#00B7A3`):** Turquesa. Estado de éxito exclusivamente: orden lista para retirar, confirmación de pago, acción completada. Su frialdad contrasta con la calidez del resto de la paleta y hace que las notificaciones de listo destaquen sin animación.
- **Neutral (`#FFE7B3`):** Crema/amarillo cálido. Fondos de chips inactivos, `surface-variant`, texto sobre `primary`. Evita el blanco puro para mantener la calidez artesanal de la marca.
- **Surface (`#FFFFFF`):** Blanco. Tarjetas de producto, campos de formulario. El único blanco puro — reservado para contener información, nunca como fondo de pantalla.
- **Error (`#C0392B`):** Rojo para validaciones y acciones destructivas.

### Ratios de contraste aprobados

| Texto | Fondo | Ratio | WCAG |
|-------|-------|-------|------|
| `#FFE7B3` sobre `#230C00` | Toolbar / bottom nav | ~13:1 | AAA |
| `#230C00` sobre `#E8630A` | Botón primario | ~4.8:1 | AA |
| `#230C00` sobre `#00B7A3` | Badge "lista" | ~4.7:1 | AA |
| `#230C00` sobre `#FFE7B3` | Chip inactivo | ~11:1 | AAA |
| `#230C00` sobre `#FFFFFF` | Texto en tarjeta | ~19:1 | AAA |

> **Nunca** texto blanco (`#FFFFFF`) sobre naranja (`#E8630A`) — el ratio es ~2.6:1, reprueba WCAG AA.

## Typography

Dos familias, dos propósitos.

**Angellya** — caligráfica, orgánica, representa la voz de Le Tiende. Se usa únicamente en elementos de marca: splash screen y encabezados de sección especiales. Nunca en tamaños menores a 1.5 rem; nunca en texto funcional (labels, precios, formularios, notificaciones).

**Poppins** — geométrica, legible, disponible en Google Fonts. Maneja toda la jerarquía funcional de la interfaz. Su geometría circular es excepcional para lectura en pantallas pequeñas y condiciones de iluminación variada (luz tenue de cafetería, sol directo en terraza).

### Escala tipográfica (base móvil)

Todas las medidas están definidas para viewport ≤ 428 px. No se usa escalado fluido — los saltos son deliberados y se controlan con breakpoints.

| Token | Familia | Tamaño | Peso | Uso |
|-------|---------|--------|------|-----|
| `brand` | Angellya | 2 rem | 400 | Nombre de marca en splash/dashboard |
| `h1` | Poppins | 1.5 rem | 700 | Título de sección principal |
| `h2` | Poppins | 1.25 rem | 600 | Subtítulos, nombre de categoría activa |
| `h3` | Poppins | 1.125 rem | 600 | Nombre de producto en tarjeta |
| `body-md` | Poppins | 1 rem | 400 | Descripciones, texto de apoyo |
| `body-sm` | Poppins | 0.875 rem | 400 | Metadata, timestamps |
| `label` | Poppins | 0.75 rem | 600 | Chips, badges, etiquetas (siempre mayúscula) |
| `price` | Poppins | 1.25 rem | 700 | Precios en tarjeta y en carrito |

## Layout

### Estructura de pantalla estándar (mesero)

```
┌─────────────────────────────┐  ← Top toolbar  56 px  [primary]
│  ←  Título de pantalla  ⋯  │
├─────────────────────────────┤
│                             │
│   Área de contenido         │  ← ion-content, scroll vertical
│   padding: 16px horizontal  │
│                             │
├─────────────────────────────┤  ← Cart summary bar  64 px  [secondary]
│  🛒  3 ítems   $45.000  →  │    Solo visible con ≥ 1 ítem en carrito
├─────────────────────────────┤
│  [Inicio]  [Orden]  [Hist.] │  ← Bottom nav  64 px  [primary]
│                             │  ← + env(safe-area-inset-bottom)
└─────────────────────────────┘
```

**Safe areas obligatorias:** siempre sumar `env(safe-area-inset-bottom)` al bottom nav y al cart summary bar. En iPhone con notch/Dynamic Island esto agrega ~34 px adicionales.

**Área táctil mínima:** todo elemento interactivo debe tener un hit target de **48 × 48 px**. Los meseros usan la app con prisa, a veces con guantes o manos húmedas.

### Grid de contenido

- **Móvil (< 768 px):** Tarjetas de producto en grid de 2 columnas. Gutter 12 px. Padding de pantalla 16 px laterales.
- **Tablet (≥ 768 px):** Grid de 3 columnas. Padding 24 px.
- **Desktop (≥ 1280 px):** Layout de dos paneles: navegación lateral izquierda + área de contenido principal.

La cuadrícula de 2 columnas en móvil es deliberada — maximiza la cantidad de productos visibles sin scroll y facilita el reconocimiento visual por imagen.

### Scroll y posicionamiento

- El catálogo de productos hace scroll vertical nativo (`overflow-y: auto`).
- Los chips de categoría hacen scroll horizontal sin scrollbar visible (`scrollbar-width: none`).
- Toolbar superior y bottom nav son siempre `position: sticky` / fijos.
- El cart summary bar usa `position: fixed; bottom: 64px` (sobre el bottom nav) con animación de entrada `slide-up` al agregar el primer ítem.

## Elevation & Depth

Comandante usa elevación mínima. El contexto de cafetería pide claridad y velocidad, no profundidad decorativa.

| Nivel | Elemento | Sombra |
|-------|----------|--------|
| 0 | Fondo de pantalla (`#F7F5F2`) | ninguna |
| 1 | Tarjetas de producto y órdenes | `0 1px 3px rgba(35,12,0,0.12)` |
| 2 | Cart summary bar, bottom sheets | `0 -4px 16px rgba(35,12,0,0.15)` |
| 3 | Toasts y snackbars | `0 4px 12px rgba(35,12,0,0.20)` |

Las sombras usan el color `primary` como base (`rgba(35,12,0,…)`) en lugar de negro puro — mantiene la calidez de la paleta incluso en las sombras.

## Shapes

- **`rounded.sm` (8 px):** Campos de formulario (`ion-input`), ítems de carrito.
- **`rounded.md` (16 px):** Tarjetas de producto, botones principales. En el cart summary bar solo aplica en esquinas superiores: `border-radius: 16px 16px 0 0`.
- **`rounded.lg` (24 px):** Bottom sheets, modales de confirmación.
- **`rounded.full` (9999 px):** Chips de categoría, badges de estado de orden, quantity steppers.

No se usan esquinas cuadradas (0 px) en ningún componente — contradicen el carácter orgánico y artesanal de la marca.

## Components

### Botón primario
El único elemento que usa `secondary` (`#E8630A`) como fondo. Altura mínima 48 px (touch target). Texto en `label` (Poppins 12 px / 600 / `tracking-wider`). El estado deshabilitado usa gris neutro — nunca una versión más clara del naranja.

### Chips de categoría
Scroll horizontal sin scrollbar. El chip activo cambia de fondo `neutral` a `secondary` con transición de 0 ms — la velocidad importa durante el servicio. El chip seleccionado no se centra automáticamente (no usar `scrollIntoView` con smooth behavior).

### Tarjetas de producto
Grid de 2 columnas en móvil. Imagen con `object-fit: cover` en la mitad superior de la tarjeta. Nombre en `h3`, precio en `price`. Si el producto está agotado: overlay semitransparente (`rgba(35,12,0,0.6)`) con etiqueta "Agotado" en `label`.

### Quantity stepper (–  n  +)
Botones circular de 48×48 px con fondo `surface-variant`. El número central en `h2`. Si la cantidad llega a 0 en el carrito, eliminar el ítem inmediatamente (sin confirmación extra).

### Cart summary bar
Aparece con `slide-up` (200 ms, ease-out) al agregar el primer ítem. Fondo `secondary`. Muestra: ícono de carrito + cantidad de ítems + total en `price`. Al tocarlo, expande el resumen completo del carrito (bottom sheet nivel 2).

### Badges de estado de orden

| Estado | Fondo | Texto | Cuándo |
|--------|-------|-------|--------|
| Pendiente | `neutral` | `primary` | Orden recibida, en cola |
| Preparando | `secondary` | `on-secondary` | Barista tomó la orden |
| Lista | `tertiary` | `on-tertiary` | Orden lista para retirar |

El badge "Lista" (`tertiary`) es deliberadamente el único color frío — destaca sin necesidad de animación ni sonido.

### Selector de propina
Chips horizontales con porcentajes comunes (10%, 15%, 20%) más opción "Otra". El chip activo cambia a fondo `primary` con texto `on-primary`. El cálculo de propina y discriminación para datafonos se muestra en tiempo real debajo del selector.

### Toolbar superior
Fondo `primary`. Ícono de retroceso (`←`) y título de pantalla en `h2` color `on-primary`. Acciones secundarias (⋯) a la derecha.

### Bottom navigation (mesero)
Máximo 3 tabs: Dashboard, Nueva Orden, Historial. Íconos Ionicons en `on-primary` cuando inactivos, `secondary` cuando activos. Label opcional bajo el ícono en Poppins 10 px. Altura 64 px + `safe-area-inset-bottom`.

## Do's and Don'ts

### Usar ✓

- Fondo `primary` (`#230C00`) para todo el chrome (toolbars, nav) — crea coherencia con el entorno oscuro de la cafetería.
- Fondo de pantalla `#F7F5F2` (blanco roto) o `neutral` (`#FFE7B3`) para secciones — nunca blanco puro `#FFFFFF` en el fondo de una pantalla completa.
- `secondary` (`#E8630A`) para **una sola CTA por pantalla**. Si hay dos acciones, una es primaria (naranja) y la otra es secundaria (outlined/texto).
- `tertiary` (`#00B7A3`) exclusivamente para estados de éxito y confirmación. Nunca decorativo.
- Precios en formato colombiano: **`$45.000`** (punto como separador de miles, sin decimales para COP).
- Touch targets ≥ 48×48 px en cualquier elemento interactivo.
- `env(safe-area-inset-bottom)` en todos los elementos fijos en el borde inferior.

### No hacer ✗

- No usar `<ion-page>` como contenedor en templates de componentes Standalone — colapsa el layout en móvil (ver gotcha en CLAUDE.md §7).
- No poner texto blanco `#FFFFFF` sobre naranja `#E8630A` — ratio ~2.6:1, reprueba WCAG AA.
- No animar chips de categoría ni cambios de badge con transiciones > 150 ms — en servicio activo, la latencia visual es fricción real.
- No usar Angellya en tamaños < 1.5 rem ni en contextos funcionales (formularios, precios, notificaciones).
- No centrar texto en tarjetas de producto — alineación izquierda en toda densidad de información.
- No duplicar la barra del carrito con otro FAB flotante — el espacio en 360 px de ancho es crítico.
- No aplicar `box-shadow` a iconos individuales, badges ni chips — la elevación es solo para contenedores.
- No usar polling manual para actualizar estados de órdenes — solo listeners en tiempo real de Firestore, desuscritos al salir del componente.
