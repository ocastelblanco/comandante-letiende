import { Component, inject } from '@angular/core';
import { RealtimeStatusService } from '../db/realtime-status.service';

// Aviso global cuando algún listener de tiempo real está caído: sin él, la pantalla
// sigue mostrando el último estado como si estuviera viva.
@Component({
  selector: 'app-connection-banner',
  standalone: true,
  template: `
    @if (status.down()) {
      <div role="status"
           style="position:fixed;top:0;left:0;right:0;z-index:20000;display:flex;align-items:center;
                  justify-content:center;gap:12px;padding:calc(6px + env(safe-area-inset-top)) 12px 6px;
                  background:var(--ion-color-secondary);color:var(--ion-color-primary);
                  font-size:.8rem;font-weight:600">
        <span>Sin conexión en tiempo real. Reintentando…</span>
        <button type="button" (click)="status.retryNow()"
                style="background:none;border:1px solid currentColor;border-radius:9999px;
                       padding:2px 12px;font:inherit;color:inherit;cursor:pointer">
          Reintentar
        </button>
      </div>
    }
  `,
})
export class ConnectionBannerComponent {
  protected readonly status = inject(RealtimeStatusService);
}
