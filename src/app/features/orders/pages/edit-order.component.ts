import { Component, OnInit, OnDestroy, inject, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, switchMap } from 'rxjs';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

// Services y Models
import { OrderService, NotificationService } from '@core/services';
import { Order, OrderStatus, OrderStatusLabels, UpdateOrderStatusRequest } from '@core/models';

@Component({
  selector: 'app-edit-order',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  templateUrl: './edit-order.component.html',
  styleUrls: ['./edit-order.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EditOrderComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly orderService = inject(OrderService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroy$ = new Subject<void>();

  editForm!: FormGroup;
  order: Order | null = null;
  isLoading = true;
  isSubmitting = false;

  availableStatuses = Object.keys(OrderStatus)
    .filter(key => isNaN(Number(key)))
    .map(key => ({
      value: OrderStatus[key as keyof typeof OrderStatus],
      label: OrderStatusLabels[OrderStatus[key as keyof typeof OrderStatus]]
    }));

  ngOnInit(): void {
    this.initializeForm();
    this.loadOrder();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa el formulario
   */
  private initializeForm(): void {
    this.editForm = this.formBuilder.group({
      status: ['', [Validators.required]]
    });
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
            this.editForm.patchValue({
              status: this.order.status
            });
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
   * Envía el formulario
   */
  onSubmit(): void {
    if (this.editForm.invalid || !this.order || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;

    const request: UpdateOrderStatusRequest = {
      orderId: this.order.id,
      newStatus: this.editForm.value.status
    };

    this.orderService.updateOrderStatus(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.notificationService.success('Estado de la orden actualizado exitosamente');
            this.router.navigate(['/orders', this.order!.id]);
          } else {
            this.notificationService.error(response.message || 'Error al actualizar el estado');
          }
          this.isSubmitting = false;
        },
        error: (error) => {
          this.notificationService.error('Error al actualizar el estado');
          console.error('Error updating order status:', error);
          this.isSubmitting = false;
        }
      });
  }

  /**
   * Regresa a la vista anterior
   */
  goBack(): void {
    if (this.order) {
      this.router.navigate(['/orders', this.order.id]);
    } else {
      this.router.navigate(['/orders']);
    }
  }

  /**
   * Obtiene etiqueta del estado
   */
  getStatusLabel(status: OrderStatus): string {
    return OrderStatusLabels[status];
  }
}