import { inject, Injectable, OnDestroy, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut, User } from '@angular/fire/auth';
import { doc, Firestore, getDoc } from '@angular/fire/firestore';
import { Subscription } from 'rxjs';
import { authState } from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class AuthService implements OnDestroy {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

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
    const credential = await signInWithPopup(this.auth, provider);

    const userRef = doc(this.firestore, 'users', credential.user.email!);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await this.signOut();
      throw new Error('Este correo no está autorizado para acceder a Comandante.');
    }
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
