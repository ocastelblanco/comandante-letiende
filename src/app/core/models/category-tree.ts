import { ProductCategory, ProductSubcategory } from './product.model';

// Árbol de categorías de producto: única fuente de verdad para el tipo TS
// (declarado en product.model.ts), el filtro de UI, los selects del
// formulario y la validación del import de Excel.

export interface CategorySubcategoryOption {
  readonly value: ProductSubcategory;
  readonly label: string;
}

export interface CategoryTreeNode {
  readonly value: ProductCategory;
  readonly label: string;
  readonly icon: string;
  readonly subcategories: readonly CategorySubcategoryOption[];
}

export const CATEGORY_TREE: readonly CategoryTreeNode[] = [
  {
    value: 'bebidas',
    label: 'Bebidas',
    icon: 'cafe-outline',
    subcategories: [
      { value: 'de_cafe', label: 'De café' },
      { value: 'calientes', label: 'Calientes' },
      { value: 'frias', label: 'Frías' },
    ],
  },
  {
    value: 'cocteles',
    label: 'Cocteles',
    icon: 'wine-outline',
    subcategories: [
      { value: 'clasicos', label: 'Clásicos' },
      { value: 'de_autor', label: 'De autor' },
      { value: 'premium', label: 'Premium' },
    ],
  },
  {
    value: 'licores',
    label: 'Licores',
    icon: 'flask-outline',
    subcategories: [
      { value: 'trago', label: 'Trago' },
      { value: 'botella', label: 'Botella' },
    ],
  },
  {
    value: 'cervezas',
    label: 'Cervezas',
    icon: 'beer-outline',
    subcategories: [
      { value: 'nacionales', label: 'Nacionales' },
      { value: 'importadas', label: 'Importadas' },
      { value: 'artesanales', label: 'Artesanales' },
    ],
  },
  {
    value: 'comida',
    label: 'Comida',
    icon: 'restaurant-outline',
    subcategories: [],
  },
  {
    value: 'reposteria',
    label: 'Repostería',
    icon: 'ice-cream-outline',
    subcategories: [],
  },
  {
    value: 'ofertas',
    label: 'Combos y promociones',
    icon: 'pricetag-outline',
    subcategories: [
      { value: 'combos', label: 'Combos' },
      { value: 'promociones', label: 'Promociones' },
    ],
  },
];

export interface CategoryFilterChip {
  /** Clave única del chip; ver `categoryFilterKey()`. */
  readonly key: string;
  /** Ícono de la categoría raíz (compartido por todas sus subcategorías). */
  readonly icon: string;
  /** Subcategoría si la categoría la tiene; si no, el nombre de la categoría. */
  readonly label: string;
}

/** Clave de filtro de un producto: `categoria` o `categoria/subcategoria`. */
export function categoryFilterKey(category: string, subcategory: string | null | undefined): string {
  return subcategory ? `${category}/${subcategory}` : category;
}

/**
 * Chips del filtro de UI: uno por cada subcategoría (o uno por la categoría
 * cuando no tiene subcategorías). El ícono identifica la categoría y el texto
 * la subcategoría, así que agregar subcategorías no exige íconos nuevos.
 */
export const CATEGORY_FILTER_CHIPS: readonly CategoryFilterChip[] = CATEGORY_TREE.flatMap((c) =>
  c.subcategories.length > 0
    ? c.subcategories.map((s) => ({ key: categoryFilterKey(c.value, s.value), icon: c.icon, label: s.label }))
    : [{ key: categoryFilterKey(c.value, null), icon: c.icon, label: c.label }],
);

export function getCategoryNode(category: string): CategoryTreeNode | undefined {
  return CATEGORY_TREE.find((c) => c.value === category);
}

export function isValidCategory(value: string): value is ProductCategory {
  return CATEGORY_TREE.some((c) => c.value === value);
}

export function categoryRequiresSubcategory(category: string): boolean {
  return (getCategoryNode(category)?.subcategories.length ?? 0) > 0;
}

export function isValidSubcategory(category: string, subcategory: string): boolean {
  const node = getCategoryNode(category);
  return !!node && node.subcategories.some((s) => s.value === subcategory);
}
