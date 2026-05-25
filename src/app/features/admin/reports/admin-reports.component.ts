import { Component, computed, inject } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { barChartOutline, personCircleOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar],
  styles: [`
    :host { display: block; height: 100%; }
    @media (min-width: 1024px) { ion-header { display: none; } }
  `],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar style="--background:#230C00;--color:#FFE7B3">
        <img slot="start" src="/logo_blanco_sin_fondo.svg" alt="Le Tiende"
             style="height:24px;margin-left:16px">
        <ion-title>Reportes</ion-title>
        <ion-buttons slot="end">
          @if (photoURL()) {
            <img [src]="photoURL()!" alt="avatar" referrerpolicy="no-referrer"
                 style="width:32px;height:32px;border-radius:50%;object-fit:cover;
                        margin-right:12px;border:2px solid rgba(255,231,179,.5)">
          } @else {
            <ion-button fill="clear">
              <ion-icon slot="icon-only" name="person-circle-outline"
                        style="font-size:1.6rem;color:#FFE7B3" />
            </ion-button>
          }
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="p-4 lg:p-8 max-w-5xl mx-auto">

        <!-- Desktop page header -->
        <div class="hidden lg:block mb-8">
          <h1 class="text-2xl font-bold text-[#230C00]">Reportes</h1>
        </div>

        <!-- Placeholder -->
        <div class="bg-white rounded-2xl shadow-[0_1px_3px_rgba(35,12,0,0.12)]
                    flex flex-col items-center justify-center py-20 gap-4">
          <ion-icon name="bar-chart-outline"
                    style="font-size:3.5rem;color:rgba(35,12,0,0.18)" />
          <p class="text-[#230C00] text-base font-semibold">Próximamente</p>
          <p class="text-[#230C00]/40 text-sm text-center max-w-xs">
            Los reportes de ventas y desempeño estarán disponibles en una próxima versión.
          </p>
        </div>

      </div>
    </ion-content>
  `,
})
export class AdminReportsComponent {
  private auth = inject(AuthService);
  protected readonly photoURL = computed(() => this.auth.currentUser()?.photoURL ?? null);

  constructor() {
    addIcons({ barChartOutline, personCircleOutline });
  }
}
