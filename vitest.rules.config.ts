import { defineConfig } from 'vitest/config';

// Config de Vitest independiente de `vitest.config.ts` (que usa el builder de
// Angular con entorno jsdom). Estas pruebas necesitan Node real para hablar
// con el emulador de Firestore vía @firebase/rules-unit-testing — no pueden
// correr dentro del builder `@angular/build:unit-test`.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['firestore.rules.spec.ts'],
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
