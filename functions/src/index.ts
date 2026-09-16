import { initializeApp } from 'firebase-admin/app';
import { getFirestore, type DocumentSnapshot } from 'firebase-admin/firestore';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';

initializeApp();

/**
 * Subconjunto público de un producto, expuesto en `/publicMenu` para que el
 * sitio web público (letiende.co) pueda mostrar el menú sin autenticación.
 * NO incluye `basePrice` ni `tipAmount`: son desglose interno de negocio.
 */
interface PublicMenuItem {
  name: string;
  category: string;
  subcategory: string | null;
  totalPrice: number;
  isActive: true;
}

/**
 * Espeja los productos activos de `/products` hacia la colección pública de
 * solo lectura `/publicMenu`, consumida por el sitio web público letiende.co
 * (repositorio separado, sin autenticación).
 *
 * - Si el producto fue borrado o quedó inactivo (`isActive !== true`), se
 *   elimina el espejo correspondiente en `/publicMenu` (si existe).
 * - Si el producto existe y está activo, se sobreescribe completo el
 *   documento espejo con únicamente los campos públicos permitidos.
 */
export const syncPublicMenu = onDocumentWritten('products/{productId}', async (event) => {
  const productId = event.params.productId;
  const db = getFirestore();
  const publicMenuRef = db.collection('publicMenu').doc(productId);

  const after: DocumentSnapshot | undefined = event.data?.after;
  const afterData = after?.data();

  if (!after?.exists || !afterData || afterData['isActive'] !== true) {
    await publicMenuRef.delete().catch(() => {
      // El documento espejo ya no existe (o nunca existió); no es un error.
    });
    return;
  }

  const publicItem: PublicMenuItem = {
    name: afterData['name'] as string,
    category: afterData['category'] as string,
    subcategory: (afterData['subcategory'] as string | null | undefined) ?? null,
    totalPrice: afterData['totalPrice'] as number,
    isActive: true,
  };

  await publicMenuRef.set(publicItem);
});
