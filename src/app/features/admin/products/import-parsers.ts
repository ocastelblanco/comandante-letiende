// Funciones puras para parsear las columnas del Excel de importación de
// productos. Extraídas de products.component.ts para poder probarlas sin
// TestBed ni un archivo real — ver import-parsers.spec.ts.

import { ProductAddition } from '../../../core/models/product.model';

/**
 * Parsea una columna de lista separada por comas (`additions`, `variants`)
 * en un array de strings recortados, sin elementos vacíos.
 * '' o undefined -> [].
 */
export function parseList(raw: unknown): string[] {
  const str = String(raw ?? '').trim();
  if (!str) return [];
  return str
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Parsea una columna de lista de precios separada por comas
 * (`additionPrices`) en un array de números. Los valores no numéricos
 * quedan como `NaN` — la validación de finitud es responsabilidad de quien
 * llama (`buildAdditions` la rechaza explícitamente).
 */
export function parsePriceList(raw: unknown): number[] {
  const str = String(raw ?? '').trim();
  if (!str) return [];
  return str.split(',').map((s) => Number(s.trim()));
}

/**
 * Interpreta la columna `active` del Excel, que puede llegar como booleano
 * nativo (si la celda es TRUE/FALSE de Excel) o como texto ('TRUE', 'true',
 * '1', 'si', etc.). Cualquier otro valor se considera inválido y retorna
 * `null`, para que el llamador lo reporte como error en vez de asumir un
 * valor por defecto silenciosamente.
 */
export function parseBoolean(raw: unknown): boolean | null {
  if (typeof raw === 'boolean') return raw;
  const str = String(raw ?? '').trim().toLowerCase();
  if (['true', 'verdadero', '1', 'si', 'sí', 'x'].includes(str)) return true;
  if (['false', 'falso', '0', 'no', ''].includes(str)) return false;
  return null;
}

/**
 * Encuentra el primer valor duplicado de una lista (comparación insensible
 * a mayúsculas y espacios sobrantes). Retorna `null` si no hay duplicados.
 * Se usa para rechazar variantes o nombres de adición repetidos en una
 * misma fila.
 */
export function findDuplicate(values: string[]): string | null {
  const seen = new Set<string>();
  for (const value of values) {
    const key = value.trim().toLowerCase();
    if (seen.has(key)) return value;
    seen.add(key);
  }
  return null;
}

export interface BuildAdditionsResult {
  additions: ProductAddition[];
  error: string | null;
}

/**
 * Combina las columnas ya parseadas `additions` (nombres) y `additionPrices`
 * (precios paralelos) en un array de `ProductAddition`. Nunca lanza: si algo
 * falla retorna `additions: []` y `error` con el motivo, para que el
 * llamador pueda seguir acumulando errores fila a fila sin cortar el
 * procesamiento del archivo completo.
 *
 * Valida, en este orden: misma cantidad de elementos en ambas listas, cada
 * precio es un número finito no negativo, y no hay nombres de adición
 * duplicados.
 */
export function buildAdditions(names: string[], prices: number[]): BuildAdditionsResult {
  if (names.length !== prices.length) {
    return {
      additions: [],
      error: `additions (${names.length}) y additionPrices (${prices.length}) tienen distinta cantidad de elementos`,
    };
  }

  const duplicate = findDuplicate(names);
  if (duplicate !== null) {
    return { additions: [], error: `adición duplicada: "${duplicate}"` };
  }

  const additions: ProductAddition[] = [];
  for (let i = 0; i < names.length; i++) {
    const addition = names[i];
    const additionPrice = prices[i];
    if (!isFinite(additionPrice) || additionPrice < 0) {
      return { additions: [], error: `precio de adición inválido para "${addition}"` };
    }
    additions.push({ addition, additionPrice });
  }

  return { additions, error: null };
}
