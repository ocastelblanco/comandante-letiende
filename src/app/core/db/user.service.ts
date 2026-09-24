import { inject, Injectable, signal } from '@angular/core';
import {
  collection,
  doc,
  Firestore,
  onSnapshot,
  QuerySnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { AppUser, UserRole } from '../models/user.model';
import { connectWhileAuthenticated } from './live-listener';

@Injectable({ providedIn: 'root' })
export class UserService {
  private firestore = inject(Firestore);
  private colRef = collection(this.firestore, 'users');

  private readonly _users = signal<AppUser[]>([]);
  readonly users = this._users.asReadonly();

  constructor() {
    connectWhileAuthenticated<QuerySnapshot>(
      'users',
      (next, error) => onSnapshot(this.colRef, next, error),
      (snap) => this._users.set(snap.docs.map((d) => d.data() as AppUser)),
      () => this._users.set([]),
    );
  }

  // El documento usa el email como ID para que el administrador pueda crear
  // usuarios por correo sin necesitar el UID de Firebase Auth.
  createUser(email: string, displayName: string, role: UserRole): Promise<void> {
    return setDoc(doc(this.firestore, 'users', email), {
      email,
      displayName,
      role,
      createdAt: serverTimestamp(),
    });
  }

  updateUserRole(email: string, role: UserRole): Promise<void> {
    return updateDoc(doc(this.firestore, 'users', email), { role });
  }
}
