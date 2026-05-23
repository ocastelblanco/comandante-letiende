import { Component, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
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
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonSpinner,
    IonText,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <ion-page>
      <ion-content class="ion-padding flex items-center justify-center">
        <ion-card class="mx-auto max-w-sm w-full">
          <ion-card-header class="text-center">
            <ion-card-title class="text-2xl font-bold">Comandante</ion-card-title>
            <p class="text-sm mt-1 opacity-60">Le Tiende · Bogotá</p>
          </ion-card-header>

          <ion-card-content>
            @if (error()) {
              <ion-text color="danger">
                <p class="text-sm mb-4 text-center">{{ error() }}</p>
              </ion-text>
            }

            <ion-button
              expand="block"
              (click)="login()"
              [disabled]="loading()"
              class="mt-2"
            >
              @if (loading()) {
                <ion-spinner name="crescent" slot="start" />
              } @else {
                <ion-icon slot="start" name="logo-google" />
              }
              Ingresar con Google
            </ion-button>
          </ion-card-content>
        </ion-card>
      </ion-content>
    </ion-page>
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
