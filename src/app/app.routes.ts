import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadChildren: () => import('./features/reports/routes/reports.routes').then(r => r.REPORTS_ROUTES)
      },
      {
        path: 'orders',
        loadChildren: () => import('./features/orders/routes/orders.routes').then(r => r.ORDERS_ROUTES)
      },
      {
        path: 'customers',
        loadChildren: () => import('./features/customers/routes/customers.routes').then(r => r.CUSTOMERS_ROUTES)
      },
      {
        path: 'products',
        loadChildren: () => import('./features/products/routes/products.routes').then(r => r.PRODUCTS_ROUTES)
      },
      {
        path: 'reports',
        loadChildren: () => import('./features/reports/routes/reports.routes').then(r => r.REPORTS_ROUTES)
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];