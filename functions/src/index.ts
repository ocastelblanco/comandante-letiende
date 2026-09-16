import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { onRequest, type Request, type Response } from 'firebase-functions/v2/https';

initializeApp();

/**
 * Subconjunto público de un producto, expuesto en la respuesta JSON de
 * `publicMenu` para que el sitio web público (letiende.co) pueda mostrar el
 * menú sin autenticación. NO incluye `basePrice`, `tipAmount`, `id`,
 * `createdAt` ni `updatedAt`: son desglose interno de negocio.
 */
interface PublicMenuItem {
  name: string;
  category: string;
  subcategory: string | null;
  totalPrice: number;
}

interface PublicMenuResponse {
  updatedAt: string;
  items: PublicMenuItem[];
}

/**
 * Cloud Function HTTPS (Gen2) que genera el menú público como JSON
 * on-demand, consultando `/products` con el Admin SDK (no consume cuota del
 * cliente). Se expone en Hosting bajo `/menu.json` con `Cache-Control`
 * apuntado al CDN de Firebase Hosting, de modo que la gran mayoría de las
 * peticiones del sitio público letiende.co se sirven desde caché y casi
 * ninguna llega a Firestore.
 */
export const publicMenu = onRequest(
  { region: 'us-central1', maxInstances: 10 },
  async (req: Request, res: Response) => {
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method Not Allowed' });
      return;
    }

    try {
      const db = getFirestore();
      const snapshot = await db.collection('products').where('isActive', '==', true).get();

      const items: PublicMenuItem[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          name: data['name'] as string,
          category: data['category'] as string,
          subcategory: (data['subcategory'] as string | null | undefined) ?? null,
          totalPrice: data['totalPrice'] as number,
        };
      });

      const body: PublicMenuResponse = {
        updatedAt: new Date().toISOString(),
        items,
      };

      res.set('Content-Type', 'application/json');
      res.set('Cache-Control', 'public, max-age=300, s-maxage=300');
      res.set('Access-Control-Allow-Origin', '*');
      res.status(200).json(body);
    } catch (error) {
      console.error('Error al generar el menú público:', error);
      res.status(500).json({ error: 'Error interno al generar el menú público' });
    }
  }
);
