import { Component, OnInit, OnDestroy, inject, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, switchMap } from 'rxjs';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';

// Services y Models
import { OrderService, NotificationService } from '@core/services';
import { Order, OrderStatus, OrderStatusLabels } from '@core/models';
import { DateUtil } from '@core/utils/date.util';
import { CoordinatesUtil } from '@core/utils/coordinates.util';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatMenuModule
  ],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class OrderDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly orderService = inject(OrderService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroy$ = new Subject<void>();

  order: Order | null = null;
  isLoading = true;

  ngOnInit(): void {
    this.loadOrder();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga la orden
   */
  private loadOrder(): void {
    this.route.paramMap
      .pipe(
        switchMap(params => {
          const orderId = params.get('id');
          if (!orderId) {
            throw new Error('ID de orden no válido');
          }
          return this.orderService.getOrderById(orderId);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.order = response.data;
          } else {
            this.notificationService.error(response.message || 'Error al cargar la orden');
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.notificationService.error('Error al cargar la orden');
          console.error('Error loading order:', error);
          this.isLoading = false;
        }
      });
  }

  /**
   * Regresa a la lista
   */
  goBack(): void {
    this.router.navigate(['/orders']);
  }

  /**
   * Editar orden
   */
  editOrder(): void {
    if (this.order) {
      this.router.navigate(['/orders', this.order.id, 'edit']);
    }
  }

  /**
   * Descargar PDF
   */
  downloadPdf(): void {
    this.notificationService.info('Función de descarga en desarrollo');
  }

  /**
   * Duplicar orden
   */
  duplicateOrder(): void {
    this.notificationService.info('Función de duplicado en desarrollo');
  }

  /**
   * Obtiene etiqueta del estado
   */
  getStatusLabel(status: OrderStatus): string {
    return OrderStatusLabels[status];
  }

  /**
   * Formatea fecha y hora
   */
  formatDateTime(date: string): string {
    return DateUtil.formatDateTime(date);
  }

  /**
   * Formatea coordenadas
   */
  formatCoordinate(coordinate: any): string {
    return CoordinatesUtil.formatCoordinate(coordinate, 4);
  }
}