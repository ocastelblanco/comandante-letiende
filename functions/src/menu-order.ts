/**
 * Ordena los ítems del menú público según `order` (posición de la fila en la
 * hoja `datos`): ascendente, con los `null` al final y desempate estable por
 * nombre. Se hace en memoria porque `orderBy` de Firestore excluiría los
 * documentos que no tienen el campo.
 */
export function sortMenuItems<T extends { name: string; order: number | null }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (a.order !== b.order) {
      if (a.order === null) return 1;
      if (b.order === null) return -1;
      return a.order - b.order;
    }
    return a.name.localeCompare(b.name, 'es');
  });
}
