import { Component, ViewEncapsulation } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  children?: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatListModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SidebarComponent {
  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard'
    },
    {
      label: 'Órdenes',
      icon: 'assignment',
      route: '/orders',
      children: [
        {
          label: 'Todas las Órdenes',
          icon: 'list',
          route: '/orders'
        },
        {
          label: 'Crear Orden',
          icon: 'add',
          route: '/orders/create'
        }
      ]
    },
    {
      label: 'Clientes',
      icon: 'people',
      route: '/customers'
    },
    {
      label: 'Productos',
      icon: 'inventory',
      route: '/products'
    },
    {
      label: 'Reportes',
      icon: 'analytics',
      route: '/reports'
    }
  ];

  constructor(private router: Router) {}

  isActiveRoute(route: string): boolean {
    return this.router.url.startsWith(route);
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  trackByRoute(index: number, item: MenuItem): string {
    return item.route;
  }
}