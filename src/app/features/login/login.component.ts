import { Component, signal } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonSpinner,
  IonText,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logoGoogle } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonSpinner,
    IonText,
  ],
  styles: [`:host { display: block; height: 100%; }`],
  template: `
    <div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;background:var(--ion-background-color)">
      <ion-card style="width:100%;max-width:360px;margin:0">
        <ion-card-header style="text-align:center" class="py-[1em]">
          <img src="/logo_negro_sin_fondo.svg" alt="Le Tiende" style="width:140px;height:auto;display:block;margin:0 auto 12px">
          <ion-card-title>Comandante</ion-card-title>
        </ion-card-header>

        <ion-card-content>
          @if (error()) {
            <ion-text color="danger">
              <p style="font-size:.875rem;margin-bottom:1rem;text-align:center">{{ error() }}</p>
            </ion-text>
          }

          <ion-button
            expand="block"
            (click)="login()"
            [disabled]="loading()"
            style="margin-top:.5rem"
          >
            @if (loading()) {
              <ion-spinner name="crescent" slot="start" />
            } @else {
              <ion-icon slot="start" name="logo-google" />
            }
            <span class="ml-[1em]">Ingresar con Google</span>
          </ion-button>
        </ion-card-content>
      </ion-card>
    </div>
  `,
})
export class LoginComponent {
  protected readonly loading = signal(false);
  protected readonly error = signal('');

  constructor(private authService: AuthService) {
    addIcons({ logoGoogle });
  }

  async login(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      await this.authService.signInWithGoogle();
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Error al iniciar sesión.');
    } finally {
      this.loading.set(false);
    }
  }
}
