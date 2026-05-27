import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonIcon, IonRouterOutlet } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  appsOutline,
  barChartOutline,
  cubeOutline,
  logOutOutline,
  peopleOutline,
  receiptOutline,
} from 'ionicons/icons';
import { AuthService } from '../../core/auth/auth.service';

const NAV = [
  { path: '/admin/dashboard', icon: 'apps-outline', label: 'Dashboard' },
  { path: '/admin/orders', icon: 'receipt-outline', label: 'Pedidos' },
  { path: '/admin/products', icon: 'cube-outline', label: 'Productos' },
  { path: '/admin/users', icon: 'people-outline', label: 'Usuarios' },
  { path: '/admin/reports', icon: 'bar-chart-outline', label: 'Reportes' },
];

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, IonIcon, IonRouterOutlet],
  styles: [`
    /* Ionic aplica .ion-page al host con flex-direction:column — lo sobreescribimos */
    :host, :host.ion-page {
      display: flex !important;
      flex-direction: row !important;
      justify-content: flex-start !important;
      height: 100%;
      background: var(--color-surface);
    }
    /* Sin height explícito, ion-router-outlet queda en 0px y el contenido no aparece */
    ion-router-outlet { display: block !important; height: 100%; }
    /* text-cream/55 con colores arbitrarios no genera CSS en Tailwind v4 — usar CSS directo */
    .nav-link       { color: rgba(var(--ion-color-primary-contrast-rgb), 0.55); }
    .nav-link:hover { color: var(--ion-color-primary-contrast); background: rgba(255,255,255,0.05); }
    .nav-link.active {
      color: var(--ion-color-primary-contrast) !important;
      background: rgba(255,255,255,0.10) !important;
      padding-left: 10px !important;
      border-left: 2px solid var(--ion-color-secondary);
    }
    .mobile-nav-item             { color: rgba(var(--ion-color-primary-contrast-rgb), 0.55); }
    .mobile-nav-item.mobile-nav-active { color: var(--ion-color-secondary); }
  `],
  template: `
    <!-- SIDEBAR — desktop only (≥1024px) -->
    <aside class="hidden lg:flex flex-col w-60 shrink-0 bg-espresso" style="height:100%">
      <div class="px-5 pt-7 pb-5 border-b border-white/10">
        <img src="/logo_blanco_sin_fondo.svg" alt="Le Tiende" class="h-[4em] m-auto mb-[1em]">
        <p class="text-(--ion-color-primary-contrast) text-[1.5em] uppercase font-black text-center leading-none">Comandante</p>
      </div>

      <nav class="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        @for (item of nav; track item.path) {
          <a [routerLink]="item.path"
             routerLinkActive="active"
             class="nav-link flex items-center gap-3 px-3 py-2.5 rounded-lg
                    text-sm font-medium transition-all">
            <ion-icon [name]="item.icon" class="text-xl shrink-0" />
            {{ item.label }}
          </a>
        }
      </nav>

      <div class="px-4 py-4 border-t border-white/10 flex items-center gap-3">
        @if (photoURL()) {
          <img [src]="photoURL()!" alt="avatar" referrerpolicy="no-referrer"
               class="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-white/20" />
        } @else {
          <div class="w-9 h-9 rounded-full bg-orange flex items-center justify-center
                      text-espresso text-sm font-bold shrink-0">
            {{ initials() }}
          </div>
        }
        <div class="flex-1 min-w-0">
          <p class="text-cream text-sm font-semibold truncate">{{ displayName() }}</p>
          <button (click)="signOut()"
                  class="text-cream/45 text-xs hover:text-orange transition-colors">
            Cerrar sesión
          </button>
        </div>
      </div>
    </aside>

    <!-- MAIN CONTENT -->
    <main style="flex:1;overflow:auto;position:relative;padding-bottom:64px"
          class="lg:!pb-0">
      <ion-router-outlet />
    </main>

    <!-- BOTTOM NAV — mobile only (<1024px) -->
    <nav class="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-espresso flex items-stretch"
         style="height:calc(64px + env(safe-area-inset-bottom));
                padding-bottom:env(safe-area-inset-bottom)">
      @for (item of mobileNav; track item.path) {
        <a [routerLink]="item.path"
           routerLinkActive="mobile-nav-active"
           class="mobile-nav-item flex-1 flex flex-col items-center justify-center gap-1
                  text-[10px] font-semibold tracking-wide min-h-[48px]">
          <ion-icon [name]="item.icon" class="text-2xl" />
          {{ item.label }}
        </a>
      }
      <button (click)="signOut()"
              class="mobile-nav-item flex-1 flex flex-col items-center justify-center gap-1
                     text-[10px] font-semibold tracking-wide min-h-[48px]"
              style="background:none;border:none;cursor:pointer">
        <ion-icon name="log-out-outline" class="text-2xl" />
        Salir
      </button>
    </nav>
  `,
})
export class AdminComponent {
  private auth = inject(AuthService);

  protected readonly nav = NAV;
  protected readonly mobileNav = NAV.slice(0, 4);

  protected readonly photoURL = computed(() => this.auth.currentUser()?.photoURL ?? null);
  protected readonly displayName = computed(() => this.auth.currentUser()?.displayName ?? 'Admin');
  protected readonly initials = computed(() =>
    this.displayName().split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase(),
  );

  constructor() {
    addIcons({ appsOutline, receiptOutline, cubeOutline, peopleOutline, barChartOutline, logOutOutline });
  }

  async signOut(): Promise<void> {
    await this.auth.signOut();
  }
}
