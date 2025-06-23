import { Routes } from '@angular/router';

export const REPORTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../pages/dashboard.component').then(c => c.DashboardComponent)
  }
];