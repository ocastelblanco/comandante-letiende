import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'waiter',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/waiter/waiter.component').then((m) => m.WaiterComponent),
  },
  {
    path: 'barista',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/barista/barista.component').then((m) => m.BaristaComponent),
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/admin.component').then((m) => m.AdminComponent),
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
