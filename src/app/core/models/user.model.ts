import { Timestamp } from '@angular/fire/firestore';

// Administrador raíz: `firestore.rules` le da permisos por correo, pero el
// login de la app igual exige su documento en `/users`, así que no se borra.
export const ROOT_ADMIN_EMAIL = 'letiende.co@gmail.com';

export type UserRole = 'admin' | 'waiter' | 'barista' | 'inactive';

export interface AppUser {
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: Timestamp;
}
