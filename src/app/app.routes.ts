import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home').then(m => m.HomeComponent),
  },
  {
    path: 'player',
    loadComponent: () =>
      import('./features/player/player').then(m => m.PlayerComponent),
  },
  { path: '**', redirectTo: '' },
];
