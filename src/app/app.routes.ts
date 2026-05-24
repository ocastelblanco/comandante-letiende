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
    children: [
      {
        path: 'products',
        loadComponent: () =>
          import('./features/admin/products/products.component').then(
            (m) => m.ProductsComponent,
          ),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/admin/users/user-list.component').then(
            (m) => m.UserListComponent,
          ),
      },
      { path: '', redirectTo: 'products', pathMatch: 'full' },
    ],
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
