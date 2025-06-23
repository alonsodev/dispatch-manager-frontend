import { Component, OnInit, OnDestroy, inject, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

// Services y Models
import { OrderService, CustomerService, NotificationService } from '@core/services';
import { 
  OrderListItem, 
  CustomerListItem, 
  OrdersSearchParams, 
  OrderStatus, 
  OrderStatusLabels, 
  PagedResponse 
} from '@core/models';
import { DateUtil } from '@core/utils/date.util';
import { MatDivider } from '@angular/material/divider';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatMenuModule,
    MatTooltipModule,
    MatDivider
  ],
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class OrderListComponent implements OnInit, OnDestroy {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly orderService = inject(OrderService);
  private readonly customerService = inject(CustomerService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroy$ = new Subject<void>();

  // Form
  filtersForm!: FormGroup;

  // Data
  orders: OrderListItem[] = [];
  customers: CustomerListItem[] = [];
  orderStatuses = Object.keys(OrderStatus)
    .filter(key => isNaN(Number(key)))
    .map(key => ({
      value: OrderStatus[key as keyof typeof OrderStatus],
      label: OrderStatusLabels[OrderStatus[key as keyof typeof OrderStatus]]
    }));

  // Table
  displayedColumns: string[] = ['id', 'customer', 'product', 'distance', 'cost', 'status', 'createdAt', 'actions'];

  // Pagination
  totalCount = 0;
  pageSize = 25;
  pageIndex = 0;

  // State
  isLoading = false;

  ngOnInit(): void {
    this.initializeForm();
    this.loadData();
    this.setupFormSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa el formulario de filtros
   */
  private initializeForm(): void {
    this.filtersForm = this.formBuilder.group({
      searchTerm: [''],
      customerId: [''],
      status: ['']
    });
  }

  /**
   * Carga datos iniciales
   */
  private loadData(): void {
    this.loadCustomers();
    this.loadOrders();
  }

  /**
   * Configura subscripciones del formulario
   */
  private setupFormSubscriptions(): void {
    this.filtersForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadOrders();
      });
  }

  /**
   * Carga lista de clientes
   */
  private loadCustomers(): void {
    this.customerService.getCustomersForDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (customers) => {
          this.customers = customers;
        },
        error: (error) => {
          console.error('Error loading customers:', error);
        }
      });
  }

  /**
   * Carga órdenes con filtros
   */
  private loadOrders(): void {
    this.isLoading = true;
    
    const formValue = this.filtersForm.value;
    const params: OrdersSearchParams = {
      pageNumber: this.pageIndex + 1,
      pageSize: this.pageSize,
      searchTerm: formValue.searchTerm || undefined,
      customerId: formValue.customerId || undefined,
      status: formValue.status !== '' ? formValue.status : undefined,
      sortBy: 'CreatedAt',
      sortDirection: 'desc'
    };

    this.orderService.getOrders(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: PagedResponse<OrderListItem>) => {
          if (response.success) {
            this.orders = response.data || [];
            this.totalCount = response.totalCount;
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.notificationService.error('Error al cargar órdenes');
          console.error('Error loading orders:', error);
          this.isLoading = false;
        }
      });
  }

  /**
   * Maneja cambio de página
   */
  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadOrders();
  }

  /**
   * Limpia filtros
   */
  clearFilters(): void {
    this.filtersForm.reset({
      searchTerm: '',
      customerId: '',
      status: ''
    });
  }

  /**
   * Navega a crear orden
   */
  createOrder(): void {
    this.router.navigate(['/orders/create']);
  }

  /**
   * Ver detalles de orden
   */
  viewOrder(orderId: string): void {
    this.router.navigate(['/orders', orderId]);
  }

  /**
   * Editar orden
   */
  editOrder(orderId: string): void {
    this.router.navigate(['/orders', orderId, 'edit']);
  }

  /**
   * Descargar PDF de orden
   */
  downloadOrderPdf(orderId: string): void {
    // TODO: Implementar descarga de PDF
    this.notificationService.info('Función de descarga en desarrollo');
  }

  /**
   * Obtiene etiqueta del estado
   */
  getStatusLabel(status: OrderStatus): string {
    return OrderStatusLabels[status];
  }

  /**
   * Formatea fecha
   */
  formatDate(date: string): string {
    return DateUtil.formatDate(date);
  }
}