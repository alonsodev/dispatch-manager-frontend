import { Routes } from '@angular/router';

export const ORDERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../pages/order-list.component').then(c => c.OrderListComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('../pages/create-order.component').then(c => c.CreateOrderComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('../pages/order-detail.component').then(c => c.OrderDetailComponent)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('../pages/edit-order.component').then(c => c.EditOrderComponent)
  }
];