import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personAddOutline } from 'ionicons/icons';
import { UserService } from '../../../core/db/user.service';
import { UserRole } from '../../../core/models/user.model';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonNote,
    IonTitle,
    IonToolbar,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonInput,
    IonSpinner,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Usuarios</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
        <ion-list>
          @for (u of userService.users(); track u.email) {
            <ion-item>
              <ion-label>
                <h2>{{ u.displayName }}</h2>
                <p>{{ u.email }}</p>
              </ion-label>
              <ion-select
                slot="end"
                [value]="u.role"
                (ionChange)="onRoleChange(u.email, $event)"
                interface="popover"
              >
                <ion-select-option value="admin">Admin</ion-select-option>
                <ion-select-option value="waiter">Mesero</ion-select-option>
                <ion-select-option value="barista">Barista</ion-select-option>
              </ion-select>
            </ion-item>
          } @empty {
            <ion-item>
              <ion-label>No hay usuarios registrados.</ion-label>
            </ion-item>
          }
        </ion-list>

        @if (showAddForm()) {
          <form [formGroup]="addForm" (ngSubmit)="submitAdd()" class="mt-4">
            <ion-item>
              <ion-label position="stacked">Correo *</ion-label>
              <ion-input type="email" formControlName="email" placeholder="usuario@ejemplo.com" />
            </ion-item>
            <ion-item>
              <ion-label position="stacked">Nombre *</ion-label>
              <ion-input formControlName="displayName" placeholder="Nombre completo" />
            </ion-item>
            <ion-item>
              <ion-label position="stacked">Rol *</ion-label>
              <ion-select formControlName="role" placeholder="Seleccionar">
                <ion-select-option value="admin">Admin</ion-select-option>
                <ion-select-option value="waiter">Mesero</ion-select-option>
                <ion-select-option value="barista">Barista</ion-select-option>
              </ion-select>
            </ion-item>
            @if (addError()) {
              <ion-note color="danger" class="px-4">{{ addError() }}</ion-note>
            }
            <div class="flex gap-2 px-4 pt-4">
              <ion-button expand="block" type="submit" [disabled]="addForm.invalid || saving()">
                @if (saving()) {
                  <ion-spinner name="crescent" />
                } @else {
                  Crear usuario
                }
              </ion-button>
              <ion-button expand="block" fill="outline" type="button" (click)="cancelAdd()">
                Cancelar
              </ion-button>
            </div>
          </form>
        } @else {
          <div class="px-4 pt-4">
            <ion-button expand="block" fill="outline" (click)="showAddForm.set(true)">
              <ion-icon slot="start" name="person-add-outline" />
              Agregar usuario
            </ion-button>
          </div>
        }
    </ion-content>
  `,
})
export class UserListComponent {
  readonly userService = inject(UserService);
  private fb = inject(FormBuilder);

  constructor() {
    addIcons({ personAddOutline });
  }

  showAddForm = signal(false);
  saving = signal(false);
  addError = signal('');

  addForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    displayName: ['', Validators.required],
    role: ['waiter' as UserRole, Validators.required],
  });

  onRoleChange(email: string, event: Event): void {
    const role = (event as CustomEvent<{ value: UserRole }>).detail.value;
    this.userService.updateUserRole(email, role);
  }

  async submitAdd(): Promise<void> {
    if (this.addForm.invalid) return;
    this.saving.set(true);
    this.addError.set('');
    try {
      const { email, displayName, role } = this.addForm.getRawValue();
      await this.userService.createUser(email, displayName, role);
      this.addForm.reset({ role: 'waiter' });
      this.showAddForm.set(false);
    } catch {
      this.addError.set('No se pudo crear el usuario. Verifica los datos e intenta de nuevo.');
    } finally {
      this.saving.set(false);
    }
  }

  cancelAdd(): void {
    this.addForm.reset({ role: 'waiter' });
    this.addError.set('');
    this.showAddForm.set(false);
  }
}
