import { DestroyRef, effect, inject, untracked } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { RealtimeStatusService } from './realtime-status.service';
import { ResilientListener } from './resilient-listener';

/**
 * Conecta un listener de tiempo real solo mientras hay sesión iniciada. Debe llamarse en un
 * contexto de inyección (constructor de un servicio).
 *
 * - Al iniciar sesión (o volver a iniciarla en la misma pestaña) se suscribe de nuevo.
 * - Al cerrar sesión se cancela ANTES de que expire el token —evita el `permission-denied` que
 *   mataba el listener del singleton— y se limpia el estado reactivo (OWASP A07).
 * - Si Firestore lo cancela por un error, `ResilientListener` reintenta con espera creciente y
 *   el aviso global de conexión se enciende hasta que lleguen datos.
 */
export function connectWhileAuthenticated<T>(
  key: string,
  subscribe: (next: (value: T) => void, error: (e: unknown) => void) => () => void,
  onData: (value: T) => void,
  onCleared: () => void,
): void {
  const auth = inject(AuthService);
  const status = inject(RealtimeStatusService);

  const listener = new ResilientListener<T>(subscribe, onData, {
    onStatusChange: (down) => status.setDown(key, down),
    onError: (error) => console.warn(`[realtime] listener "${key}" falló, se reintentará:`, error),
  });
  status.register(key, listener as ResilientListener<unknown>);

  effect(() => {
    const authenticated = auth.isAuthenticated();
    untracked(() => {
      if (authenticated) {
        listener.connect();
      } else {
        listener.disconnect();
        onCleared();
      }
    });
  });

  inject(DestroyRef).onDestroy(() => listener.disconnect());
}
