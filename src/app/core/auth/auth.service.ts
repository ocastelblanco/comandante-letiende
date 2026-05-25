import { inject, Injectable, OnDestroy, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  Auth,
  GoogleAuthProvider,
  getRedirectResult,
  signInWithRedirect,
  signOut,
  User,
  authState,
} from '@angular/fire/auth';
import { doc, Firestore, getDoc } from '@angular/fire/firestore';
import { Subscription } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService implements OnDestroy {
  private readonly auth = inject(Auth);
  private readonly firestore = inject(Firestore);
  private readonly router = inject(Router);

  readonly currentUser = signal<User | null>(null);
  readonly isAuthenticated = signal(false);
  readonly authError = signal('');

  private authSub: Subscription;

  constructor() {
    this.authSub = authState(this.auth).subscribe((user) => {
      this.currentUser.set(user);
      this.isAuthenticated.set(user !== null);
    });

    this.handleRedirectResult();
  }

  private async handleRedirectResult(): Promise<void> {
    try {
      const result = await getRedirectResult(this.auth);
      if (!result) return;

      const userRef = doc(this.firestore, 'users', result.user.email!);
      let userSnap;
      try {
        userSnap = await getDoc(userRef);
      } catch {
        await signOut(this.auth);
        this.authError.set('No se pudo verificar el acceso. Comprueba la conexión e intenta de nuevo.');
        await this.router.navigate(['/login']);
        return;
      }

      if (!userSnap.exists()) {
        await signOut(this.auth);
        this.authError.set('Este correo no está autorizado para acceder a Comandante.');
        await this.router.navigate(['/login']);
        return;
      }

      const role = userSnap.data()['role'] as string;
      const destination = role === 'admin' ? '/admin' : role === 'waiter' ? '/waiter' : '/barista';
      await this.router.navigate([destination]);
    } catch {
      // No hay redirect pendiente — carga normal de la app
    }
  }

  async signInWithGoogle(): Promise<void> {
    this.authError.set('');
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(this.auth, provider);
  }

  async signOut(): Promise<void> {
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    await signOut(this.auth);
    await this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.authSub.unsubscribe();
  }
}
