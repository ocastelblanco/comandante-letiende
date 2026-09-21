import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

// Matriz de seguridad de firestore.rules (Tarea 33). Corre SOLO en CI, contra
// el emulador de Firestore (`firebase emulators:exec`) — no se ejecuta en
// local ni forma parte de `npm test`. Cubre la única frontera de seguridad
// real del sistema (ver CLAUDE.md §5): los guardias de Angular son solo UX.
//
// Nota importante: todas las pruebas "positivas" de esta matriz (un mesero
// SÍ puede crear un pedido, un barista SÍ puede actualizar su estado, etc.)
// son en conjunto la regresión explícita del gotcha ya documentado en
// CLAUDE.md §7: si `userRole()` volviera a retornar `true` (bool) en vez del
// string del rol por culpa del operador `&&`, TODAS estas pruebas positivas
// fallarían a la vez, porque `isWaiter()`/`isBarista()`/`isAdmin()` dependen
// de que `userRole()` devuelva el string exacto.

let testEnv: RulesTestEnvironment;

function adminDb() {
  return testEnv.authenticatedContext('admin-uid', { email: 'admin@test.com' }).firestore();
}
function rootAdminDb() {
  return testEnv
    .authenticatedContext('root-admin-uid', { email: 'letiende.co@gmail.com' })
    .firestore();
}
function waiterDb() {
  return testEnv.authenticatedContext('waiter-uid', { email: 'waiter@test.com' }).firestore();
}
function baristaDb() {
  return testEnv.authenticatedContext('barista-uid', { email: 'barista@test.com' }).firestore();
}
function inactiveDb() {
  return testEnv.authenticatedContext('inactive-uid', { email: 'inactive@test.com' }).firestore();
}
function anonDb() {
  return testEnv.unauthenticatedContext().firestore();
}

const validProduct = {
  name: 'Capuchino',
  description: null,
  category: 'bebidas',
  subcategory: 'de_cafe',
  variants: [] as string[],
  additions: [] as { addition: string; additionPrice: number }[],
  basePrice: 9900,
  isActive: true,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
};

const baseOrderFields = {
  items: [
    {
      productId: 'p1',
      productName: 'Capuchino',
      quantity: 1,
      variant: null,
      additions: [] as { addition: string; additionPrice: number }[],
      unitPrice: 9900,
      itemStatus: 'pending',
    },
  ],
  waiterId: 'waiter@test.com',
  waiterName: 'Waiter',
  observations: '',
  subtotal: 9900,
  tipPercentage: 10,
  tipValue: 0,
  tipAmount: 990,
  total: 10890,
  baristaId: null as string | null,
  preparedAt: null,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
};

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-comandante-rules-test',
    firestore: {
      rules: readFileSync(resolve(__dirname, 'firestore.rules'), 'utf8'),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'users/admin@test.com'), {
      email: 'admin@test.com',
      displayName: 'Admin',
      role: 'admin',
      createdAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'users/waiter@test.com'), {
      email: 'waiter@test.com',
      displayName: 'Waiter',
      role: 'waiter',
      createdAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'users/barista@test.com'), {
      email: 'barista@test.com',
      displayName: 'Barista',
      role: 'barista',
      createdAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'users/inactive@test.com'), {
      email: 'inactive@test.com',
      displayName: 'Inactive',
      role: 'inactive',
      createdAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'products/existing-product'), validProduct);
    await setDoc(doc(db, 'orders/order-unpaid'), {
      tableNumber: 'Mesa 1',
      status: 'pending',
      paid: false,
      paymentMethod: null,
      paidAt: null,
      ...baseOrderFields,
    });
    await setDoc(doc(db, 'orders/order-paid'), {
      tableNumber: 'Mesa 2',
      status: 'delivered',
      paid: true,
      paymentMethod: 'efectivo',
      paidAt: serverTimestamp(),
      ...baseOrderFields,
    });
    await setDoc(doc(db, 'orders/order-ready'), {
      tableNumber: 'Mesa 3',
      status: 'ready',
      paid: false,
      paymentMethod: null,
      paidAt: null,
      ...baseOrderFields,
    });
  });
});

describe('/users', () => {
  it('admin puede crear un usuario', async () => {
    await assertSucceeds(
      setDoc(doc(adminDb(), 'users/new@test.com'), {
        email: 'new@test.com',
        displayName: 'Nuevo',
        role: 'waiter',
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('el admin raíz (letiende.co@gmail.com) puede crear un usuario aunque no tenga documento propio', async () => {
    await assertSucceeds(
      setDoc(doc(rootAdminDb(), 'users/new2@test.com'), {
        email: 'new2@test.com',
        displayName: 'Nuevo 2',
        role: 'barista',
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('mesero no puede crear un usuario', async () => {
    await assertFails(
      setDoc(doc(waiterDb(), 'users/new3@test.com'), {
        email: 'new3@test.com',
        displayName: 'X',
        role: 'waiter',
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('barista no puede crear un usuario', async () => {
    await assertFails(
      setDoc(doc(baristaDb(), 'users/new4@test.com'), {
        email: 'new4@test.com',
        displayName: 'X',
        role: 'waiter',
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('anónimo no puede crear un usuario', async () => {
    await assertFails(
      setDoc(doc(anonDb(), 'users/new5@test.com'), {
        email: 'new5@test.com',
        displayName: 'X',
        role: 'waiter',
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('un mesero no puede alterar su propio rol', async () => {
    await assertFails(updateDoc(doc(waiterDb(), 'users/waiter@test.com'), { role: 'admin' }));
  });

  it('un mesero no puede modificar ningún campo de su propio documento', async () => {
    await assertFails(
      updateDoc(doc(waiterDb(), 'users/waiter@test.com'), { displayName: 'Otro nombre' }),
    );
  });

  it('admin puede modificar el rol de otro usuario', async () => {
    await assertSucceeds(updateDoc(doc(adminDb(), 'users/waiter@test.com'), { role: 'barista' }));
  });

  it('admin puede borrar un usuario', async () => {
    await assertSucceeds(deleteDoc(doc(adminDb(), 'users/inactive@test.com')));
  });

  it('mesero no puede borrar un usuario', async () => {
    await assertFails(deleteDoc(doc(waiterDb(), 'users/inactive@test.com')));
  });

  it('cualquier usuario autenticado puede leer /users', async () => {
    await assertSucceeds(getDoc(doc(waiterDb(), 'users/admin@test.com')));
  });

  it('anónimo no puede leer /users', async () => {
    await assertFails(getDoc(doc(anonDb(), 'users/admin@test.com')));
  });
});

describe('/products', () => {
  it('admin puede crear un producto válido', async () => {
    await assertSucceeds(setDoc(doc(adminDb(), 'products/new-product'), validProduct));
  });

  it('admin puede crear un producto de categoría sin subcategoría (comida) omitiendo subcategory', async () => {
    const { subcategory: _omit, ...rest } = validProduct;
    await assertSucceeds(
      setDoc(doc(adminDb(), 'products/comida-1'), { ...rest, category: 'comida' }),
    );
  });

  it('rechaza un producto de categoría sin subcategoría (comida) si trae subcategory', async () => {
    await assertFails(
      setDoc(doc(adminDb(), 'products/comida-2'), { ...validProduct, category: 'comida' }),
    );
  });

  it('rechaza un producto de categoría con subcategoría obligatoria si falta subcategory', async () => {
    const { subcategory: _omit, ...rest } = validProduct;
    await assertFails(setDoc(doc(adminDb(), 'products/bebidas-sin-sub'), rest));
  });

  it('rechaza una subcategory que no pertenece a la categoría', async () => {
    await assertFails(
      setDoc(doc(adminDb(), 'products/sub-invalida'), {
        ...validProduct,
        category: 'bebidas',
        subcategory: 'trago',
      }),
    );
  });

  it('rechaza una categoría inválida', async () => {
    await assertFails(
      setDoc(doc(adminDb(), 'products/categoria-invalida'), {
        ...validProduct,
        category: 'inventada',
      }),
    );
  });

  it('rechaza basePrice negativo', async () => {
    await assertFails(
      setDoc(doc(adminDb(), 'products/precio-negativo'), { ...validProduct, basePrice: -100 }),
    );
  });

  it('rechaza basePrice que no es number', async () => {
    await assertFails(
      setDoc(doc(adminDb(), 'products/precio-string'), { ...validProduct, basePrice: '9900' }),
    );
  });

  it('rechaza variants que no es una lista', async () => {
    await assertFails(
      setDoc(doc(adminDb(), 'products/variants-invalidas'), {
        ...validProduct,
        variants: 'no-es-lista',
      }),
    );
  });

  it('rechaza additions que no es una lista', async () => {
    await assertFails(
      setDoc(doc(adminDb(), 'products/additions-invalidas'), {
        ...validProduct,
        additions: 'no-es-lista',
      }),
    );
  });

  it('mesero no puede crear un producto aunque los datos sean válidos', async () => {
    await assertFails(setDoc(doc(waiterDb(), 'products/mesero-producto'), validProduct));
  });

  it('barista no puede crear un producto', async () => {
    await assertFails(setDoc(doc(baristaDb(), 'products/barista-producto'), validProduct));
  });

  it('admin puede actualizar parcialmente un producto existente con datos válidos', async () => {
    await assertSucceeds(
      updateDoc(doc(adminDb(), 'products/existing-product'), { basePrice: 12000 }),
    );
  });

  it('rechaza actualizar un producto existente con basePrice inválido', async () => {
    await assertFails(
      updateDoc(doc(adminDb(), 'products/existing-product'), { basePrice: -50 }),
    );
  });

  it('mesero no puede actualizar un producto existente', async () => {
    await assertFails(
      updateDoc(doc(waiterDb(), 'products/existing-product'), { basePrice: 5000 }),
    );
  });

  it('admin puede borrar un producto', async () => {
    await assertSucceeds(deleteDoc(doc(adminDb(), 'products/existing-product')));
  });

  it('mesero no puede borrar un producto', async () => {
    await assertFails(deleteDoc(doc(waiterDb(), 'products/existing-product')));
  });

  it('cualquier usuario autenticado puede leer productos', async () => {
    await assertSucceeds(getDoc(doc(waiterDb(), 'products/existing-product')));
  });

  it('anónimo no puede leer productos', async () => {
    await assertFails(getDoc(doc(anonDb(), 'products/existing-product')));
  });
});

describe('/orders', () => {
  it('mesero puede crear un pedido', async () => {
    await assertSucceeds(
      setDoc(doc(waiterDb(), 'orders/nuevo-1'), {
        tableNumber: 'Mesa 9',
        status: 'pending',
        paid: false,
        paymentMethod: null,
        paidAt: null,
        ...baseOrderFields,
      }),
    );
  });

  it('admin puede crear un pedido', async () => {
    await assertSucceeds(
      setDoc(doc(adminDb(), 'orders/nuevo-2'), {
        tableNumber: 'Mesa 10',
        status: 'pending',
        paid: false,
        paymentMethod: null,
        paidAt: null,
        ...baseOrderFields,
      }),
    );
  });

  it('barista no puede crear un pedido', async () => {
    await assertFails(
      setDoc(doc(baristaDb(), 'orders/nuevo-3'), {
        tableNumber: 'Mesa 11',
        status: 'pending',
        paid: false,
        paymentMethod: null,
        paidAt: null,
        ...baseOrderFields,
      }),
    );
  });

  it('anónimo no puede crear un pedido', async () => {
    await assertFails(
      setDoc(doc(anonDb(), 'orders/nuevo-4'), {
        tableNumber: 'Mesa 12',
        status: 'pending',
        paid: false,
        paymentMethod: null,
        paidAt: null,
        ...baseOrderFields,
      }),
    );
  });

  it('barista puede actualizar solo campos de estado', async () => {
    await assertSucceeds(
      updateDoc(doc(baristaDb(), 'orders/order-unpaid'), {
        status: 'preparing',
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('barista no puede cambiar campos fuera de los de estado en la misma escritura', async () => {
    await assertFails(
      updateDoc(doc(baristaDb(), 'orders/order-unpaid'), {
        status: 'preparing',
        total: 999999,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('mesero puede marcar un pedido como entregado', async () => {
    await assertSucceeds(
      updateDoc(doc(waiterDb(), 'orders/order-ready'), {
        status: 'delivered',
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('mesero no puede marcar entregado y cambiar otro campo a la vez', async () => {
    await assertFails(
      updateDoc(doc(waiterDb(), 'orders/order-ready'), {
        status: 'delivered',
        total: 1,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('mesero puede marcar un pedido sin cobrar como pagado', async () => {
    await assertSucceeds(
      updateDoc(doc(waiterDb(), 'orders/order-unpaid'), {
        paid: true,
        paymentMethod: 'datafono',
        paidAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('mesero no puede volver a marcar como pagado un pedido ya cobrado', async () => {
    await assertFails(
      updateDoc(doc(waiterDb(), 'orders/order-paid'), {
        paid: true,
        paymentMethod: 'qr',
        paidAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('mesero no puede marcar como pagado y cambiar otro campo a la vez', async () => {
    await assertFails(
      updateDoc(doc(waiterDb(), 'orders/order-unpaid'), {
        paid: true,
        paymentMethod: 'efectivo',
        paidAt: serverTimestamp(),
        total: 1,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('mesero puede editar la propina de un pedido sin cobrar', async () => {
    await assertSucceeds(
      updateDoc(doc(waiterDb(), 'orders/order-unpaid'), {
        tipPercentage: 15,
        tipValue: 500,
        tipAmount: 1985,
        total: 11885,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  // Regresión directa del bug verificado en producción: la edición de propina
  // de un pedido YA COBRADO debe seguir bloqueada por onlyUpdatesTip().
  it('mesero NO puede editar la propina de un pedido ya cobrado', async () => {
    await assertFails(
      updateDoc(doc(waiterDb(), 'orders/order-paid'), {
        tipPercentage: 15,
        tipValue: 500,
        tipAmount: 1985,
        total: 11885,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('mesero no puede editar la propina y colar un cambio de items en la misma escritura', async () => {
    await assertFails(
      updateDoc(doc(waiterDb(), 'orders/order-unpaid'), {
        tipPercentage: 15,
        items: [],
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('mesero no puede modificar los items de un pedido enviado', async () => {
    await assertFails(
      updateDoc(doc(waiterDb(), 'orders/order-unpaid'), {
        items: [],
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('admin puede modificar cualquier campo de un pedido', async () => {
    await assertSucceeds(
      updateDoc(doc(adminDb(), 'orders/order-unpaid'), {
        items: [],
        total: 0,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('admin puede borrar un pedido', async () => {
    await assertSucceeds(deleteDoc(doc(adminDb(), 'orders/order-unpaid')));
  });

  it('mesero no puede borrar un pedido', async () => {
    await assertFails(deleteDoc(doc(waiterDb(), 'orders/order-unpaid')));
  });

  it('inactive no puede actualizar un pedido', async () => {
    await assertFails(
      updateDoc(doc(inactiveDb(), 'orders/order-unpaid'), {
        status: 'delivered',
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('cualquier usuario autenticado puede leer pedidos', async () => {
    await assertSucceeds(getDoc(doc(waiterDb(), 'orders/order-unpaid')));
  });

  it('anónimo no puede leer pedidos', async () => {
    await assertFails(getDoc(doc(anonDb(), 'orders/order-unpaid')));
  });
});
