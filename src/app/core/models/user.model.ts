import { Timestamp } from '@angular/fire/firestore';

export type UserRole = 'admin' | 'waiter' | 'barista' | 'inactive';

export interface AppUser {
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: Timestamp;
}
