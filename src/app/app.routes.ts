import { Routes } from '@angular/router';
import { authGuard } from '@pure-tools/babetka';
import { licenseGuard } from '@pure-tools/monetka';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home').then(m => m.HomeComponent),
  },
  {
    path: 'player',
    canActivate: [authGuard, licenseGuard],
    loadComponent: () =>
      import('./features/player/player').then(m => m.PlayerComponent),
  },
  { path: '**', redirectTo: '' },
];
