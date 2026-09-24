import { computed, Injectable, signal } from '@angular/core';
import { ResilientListener } from './resilient-listener';

/**
 * Estado agregado de los listeners de tiempo real. Alimenta el aviso de "sin conexión en
 * tiempo real" y reanima los listeners caídos cuando la pestaña vuelve a estar visible o
 * el navegador recupera la red.
 */
@Injectable({ providedIn: 'root' })
export class RealtimeStatusService {
  private readonly downKeys = signal<ReadonlySet<string>>(new Set());
  private readonly listeners = new Map<string, ResilientListener<unknown>>();

  readonly down = computed(() => this.downKeys().size > 0);

  constructor() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') this.retryNow();
    });
    window.addEventListener('online', () => this.retryNow());
  }

  register(key: string, listener: ResilientListener<unknown>): void {
    this.listeners.set(key, listener);
  }

  setDown(key: string, down: boolean): void {
    this.downKeys.update((keys) => {
      const next = new Set(keys);
      if (down) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  retryNow(): void {
    this.listeners.forEach((listener) => listener.reviveIfFailed());
  }
}
