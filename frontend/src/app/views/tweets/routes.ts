import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./tweets.component').then(m => m.TweetsComponent),
    data: {
      title: $localize`Tweets`
    }
  }
];

