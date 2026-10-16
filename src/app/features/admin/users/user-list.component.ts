import { Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import {
  AlertController,
  IonButton,
  IonButtons,
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
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personAddOutline, personCircleOutline, trashOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/auth/auth.service';
import { UserService } from '../../../core/db/user.service';
import { AppUser, ROOT_ADMIN_EMAIL, UserRole } from '../../../core/models/user.model';
import { isValidEmail, normalizeEmail } from '../../../core/utils/email';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IonButton,
    IonButtons,
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
  ],
  styles: [`
    @media (min-width: 1024px) { ion-header { display: none; } }
  `],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <img slot="start" src="/logo_blanco_sin_fondo.svg" alt="Le Tiende" width="55" height="24"
             style="height:24px;margin-left:16px">
        <ion-title class="text-center">Usuarios</ion-title>
        <ion-buttons slot="end">
          @if (photoURL()) {
            <img [src]="photoURL()!" alt="avatar" referrerpolicy="no-referrer"
                 style="width:32px;height:32px;border-radius:50%;object-fit:cover;
                        margin-right:12px;border:2px solid rgba(255,231,179,.5)">
          } @else {
            <ion-button fill="clear">
              <ion-icon slot="icon-only" name="person-circle-outline"
                        style="font-size:1.6rem;color:var(--ion-color-primary-contrast)" />
            </ion-button>
          }
        </ion-buttons>
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
              <ion-select-option value="inactive">Inactivo</ion-select-option>
            </ion-select>
            @if (canDelete(u.email)) {
              <ion-button slot="end" fill="clear" color="danger" aria-label="Borrar usuario"
                          [disabled]="deletingEmail() === u.email" (click)="confirmDelete(u)">
                @if (deletingEmail() === u.email) {
                  <ion-spinner slot="icon-only" name="crescent" />
                } @else {
                  <ion-icon slot="icon-only" name="trash-outline" />
                }
              </ion-button>
            }
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
            <ion-input type="email" formControlName="email" placeholder="usuario@ejemplo.com"
                       autocapitalize="off" autocomplete="off" />
          </ion-item>
          @if (emailError(); as error) {
            <ion-note color="danger" class="block px-4 pt-1">{{ error }}</ion-note>
          }
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
              <ion-select-option value="inactive">Inactivo</ion-select-option>
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
  private auth = inject(AuthService);
  readonly userService = inject(UserService);
  private fb = inject(FormBuilder);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  protected readonly photoURL = computed(() => this.auth.currentUser()?.photoURL ?? null);

  constructor() {
    addIcons({ personAddOutline, personCircleOutline, trashOutline });
  }

  showAddForm = signal(false);
  saving = signal(false);
  addError = signal('');
  deletingEmail = signal<string | null>(null);

  // Un correo incompleto (p. ej. sin ".com") crea un documento cuyo ID nunca
  // coincide con el correo de Google, y el usuario no puede ingresar.
  private readonly validEmail = (control: AbstractControl<string>): ValidationErrors | null =>
    control.value === '' || isValidEmail(control.value) ? null : { invalidEmail: true };

  // `setDoc` sobre un correo ya registrado reemplazaría su rol sin avisar.
  private readonly notRegistered = (control: AbstractControl<string>): ValidationErrors | null =>
    this.userService.users().some((u) => u.email === normalizeEmail(control.value))
      ? { alreadyRegistered: true }
      : null;

  addForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, this.validEmail, this.notRegistered]],
    displayName: ['', Validators.required],
    role: ['waiter' as UserRole, Validators.required],
  });

  emailError(): string {
    const control = this.addForm.controls.email;
    if (!control.touched || control.valid) return '';
    if (control.hasError('required')) return 'Escribe el correo del usuario.';
    if (control.hasError('alreadyRegistered')) return 'Este correo ya está registrado.';
    return 'Correo incompleto o mal escrito. Revisa que termine en el dominio completo (ej. @gmail.com).';
  }

  // No se puede borrar el administrador raíz ni la propia cuenta: ambos
  // dejarían al administrador sin poder volver a ingresar.
  canDelete(email: string): boolean {
    return email !== ROOT_ADMIN_EMAIL && email !== this.auth.currentUser()?.email;
  }

  async confirmDelete(user: AppUser): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Borrar usuario',
      message: `${user.displayName} (${user.email}) ya no podrá ingresar a Comandante. `
        + 'Su cuenta de Google y su acceso a otras aplicaciones no se modifican.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Borrar', role: 'destructive', handler: () => this.deleteUser(user) },
      ],
    });
    await alert.present();
  }

  private async deleteUser(user: AppUser): Promise<void> {
    this.deletingEmail.set(user.email);
    try {
      await this.userService.deleteUser(user.email);
      this.presentToast(`Se borró a ${user.displayName}.`, 'success');
    } catch {
      this.presentToast('No se pudo borrar el usuario. Intenta de nuevo.', 'danger');
    } finally {
      this.deletingEmail.set(null);
    }
  }

  private presentToast(message: string, color: string): void {
    this.toastCtrl
      .create({ message, duration: 3000, position: 'top', color })
      .then((t) => t.present());
  }

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
      await this.userService.createUser(normalizeEmail(email), displayName.trim(), role);
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
