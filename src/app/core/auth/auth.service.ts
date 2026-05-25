import { inject, Injectable, OnDestroy, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
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

  private authSub: Subscription;

  constructor() {
    this.authSub = authState(this.auth).subscribe((user) => {
      this.currentUser.set(user);
      this.isAuthenticated.set(user !== null);
    });
  }

  async signInWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();

    // Nota: Chrome emite un warning "Cross-Origin-Opener-Policy would block
    // window.closed" durante este popup. Es un warning del browser causado por
    // el COOP propio de accounts.google.com — no es un error de nuestra app
    // y no afecta el flujo de autenticación.
    const credential = await signInWithPopup(this.auth, provider);

    const userRef = doc(this.firestore, 'users', credential.user.email!);

    let userSnap;
    try {
      userSnap = await getDoc(userRef);
    } catch {
      await signOut(this.auth);
      throw new Error('No se pudo verificar el acceso. Comprueba la conexión e intenta de nuevo.');
    }

    if (!userSnap.exists()) {
      await signOut(this.auth);
      throw new Error('Este correo no está autorizado para acceder a Comandante.');
    }

    const role = userSnap.data()['role'] as string;
    const destination = role === 'admin' ? '/admin' : role === 'waiter' ? '/waiter' : '/barista';
    await this.router.navigate([destination]);
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
