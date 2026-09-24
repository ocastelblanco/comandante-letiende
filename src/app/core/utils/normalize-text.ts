/**
 * Normaliza un texto para comparaciones de búsqueda: sin distinguir
 * mayúsculas, tildes, diéresis ni virgulilla ("Mítica" → "mitica",
 * "Pingüino" → "pinguino", "Año" → "ano"), y con los espacios colapsados.
 *
 * NFD separa cada letra de su diacrítico (U+0300–U+036F, "combining
 * diacritical marks"), que luego se elimina.
 */
export function normalizeText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}
