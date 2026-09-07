import { defineConfig } from 'vitest/config';

// `@ionic/angular` (fesm2022/ionic-angular-common.mjs) hace `import('@ionic/core/components')`,
// una importación de directorio sin `/index.js`. Node ESM nativo no soporta ese tipo de
// importación (solo Node CJS/`require` la resuelve implícitamente), y por defecto el builder
// `@angular/build:unit-test` solo pre-empaqueta con esbuild las dependencias detectadas como
// "implicit browser deps" durante el build de la app — `@ionic/core/components` no cae en esa
// lista porque solo se importa dinámicamente dentro del paquete de Ionic.
// Como las pruebas corren en entorno Node (jsdom/happy-dom, no un navegador real), el paquete
// `@ionic/angular` queda "externalizado": Vitest lo entrega tal cual al `import()` nativo de
// Node, sin pasar por el resolver de Vite (que sí tolera imports de directorio). El alias
// resuelve explícitamente el import de directorio `@ionic/core/components` a su `index.js`
// real — la solución que el propio mensaje de error de Node sugiere ("Did you mean to import
// '@ionic/core/components/index.js'?") — porque `resolve.alias` se aplica siempre durante la
// resolución de rutas, incluso para módulos externalizados.
export default defineConfig({
  resolve: {
    alias: {
      '@ionic/core/components': '@ionic/core/components/index.js',
    },
  },
});
