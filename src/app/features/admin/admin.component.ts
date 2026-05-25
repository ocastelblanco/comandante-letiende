import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonIcon, IonRouterOutlet } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  appsOutline,
  barChartOutline,
  cubeOutline,
  peopleOutline,
  receiptOutline,
} from 'ionicons/icons';
import { AuthService } from '../../core/auth/auth.service';

const NAV = [
  { path: '/admin/dashboard', icon: 'apps-outline',      label: 'Dashboard' },
  { path: '/admin/orders',   icon: 'receipt-outline',    label: 'Pedidos'   },
  { path: '/admin/products', icon: 'cube-outline',       label: 'Productos' },
  { path: '/admin/users',    icon: 'people-outline',     label: 'Usuarios'  },
  { path: '/admin/reports',  icon: 'bar-chart-outline',  label: 'Reportes'  },
];

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, IonIcon, IonRouterOutlet],
  styles: [`
    :host { display: flex; height: 100%; background: #F7F5F2; }
    .nav-link.active {
      color: #FFE7B3 !important;
      background: rgba(255,255,255,0.10) !important;
      padding-left: 10px !important;
      border-left: 2px solid #E8630A;
    }
  `],
  template: `
    <!-- SIDEBAR — desktop only (≥1024px) -->
    <aside class="hidden lg:flex flex-col w-60 shrink-0 bg-[#230C00]" style="min-height:100%">
      <div class="px-5 pt-7 pb-5 border-b border-white/10">
        <p class="text-[#FFE7B3] text-3xl leading-none"
           style="font-family:'Angellya',cursive">Comandante</p>
        <p class="text-[#FFE7B3]/40 text-xs mt-1 font-semibold tracking-widest uppercase">
          Le Tiende Admin
        </p>
      </div>

      <nav class="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        @for (item of nav; track item.path) {
          <a [routerLink]="item.path"
             routerLinkActive="active"
             class="nav-link flex items-center gap-3 px-3 py-2.5 rounded-lg
                    text-[#FFE7B3]/55 text-sm font-medium transition-all
                    hover:text-[#FFE7B3] hover:bg-white/5">
            <ion-icon [name]="item.icon" class="text-xl shrink-0" />
            {{ item.label }}
          </a>
        }
      </nav>

      <div class="px-4 py-4 border-t border-white/10 flex items-center gap-3">
        @if (photoURL()) {
          <img [src]="photoURL()!" alt="avatar"
               class="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-white/20" />
        } @else {
          <div class="w-9 h-9 rounded-full bg-[#E8630A] flex items-center justify-center
                      text-[#230C00] text-sm font-bold shrink-0">
            {{ initials() }}
          </div>
        }
        <div class="flex-1 min-w-0">
          <p class="text-[#FFE7B3] text-sm font-semibold truncate">{{ displayName() }}</p>
          <button (click)="signOut()"
                  class="text-[#FFE7B3]/45 text-xs hover:text-[#E8630A] transition-colors">
            Cerrar sesión
          </button>
        </div>
      </div>
    </aside>

    <!-- MAIN CONTENT -->
    <main class="flex-1 overflow-auto pb-16 lg:pb-0">
      <ion-router-outlet />
    </main>

    <!-- BOTTOM NAV — mobile only (<1024px) -->
    <nav class="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#230C00] flex items-stretch"
         style="height:calc(64px + env(safe-area-inset-bottom));
                padding-bottom:env(safe-area-inset-bottom)">
      @for (item of mobileNav; track item.path) {
        <a [routerLink]="item.path"
           routerLinkActive="!text-[#E8630A]"
           class="flex-1 flex flex-col items-center justify-center gap-1
                  text-[#FFE7B3]/55 text-[10px] font-semibold tracking-wide min-h-[48px]">
          <ion-icon [name]="item.icon" class="text-2xl" />
          {{ item.label }}
        </a>
      }
    </nav>
  `,
})
export class AdminComponent {
  private auth = inject(AuthService);

  protected readonly nav       = NAV;
  protected readonly mobileNav = NAV.slice(0, 4);

  protected readonly photoURL    = computed(() => this.auth.currentUser()?.photoURL    ?? null);
  protected readonly displayName = computed(() => this.auth.currentUser()?.displayName ?? 'Admin');
  protected readonly initials    = computed(() =>
    this.displayName().split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase(),
  );

  constructor() {
    addIcons({ appsOutline, receiptOutline, cubeOutline, peopleOutline, barChartOutline });
  }

  async signOut(): Promise<void> {
    await this.auth.signOut();
  }
}
