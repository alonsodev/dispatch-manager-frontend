import { Component, OnInit, OnDestroy, ViewChild, inject, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, combineLatest, startWith } from 'rxjs';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Services y Models
import { 
  CustomerService, 
  ProductService, 
  OrderService, 
  MapService,
  NotificationService,
  LoadingService
} from '@core/services';
import { 
  CustomerListItem, 
  ProductListItem, 
  CreateOrderRequest,
  Coordinate  
} from '@core/models';
import { QUANTITY_LIMITS } from '@core/models/validation.models';
import { CoordinatesUtil } from '@core/utils/coordinates.util';

// Componentes custom
import { MapSelectorComponent } from '../components/map-selector/map-selector.component';
import { OrderSummaryComponent } from '../components/order-summary/order-summary.component';

@Component({
  selector: 'app-create-order',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatStepperModule,
    MatDividerModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MapSelectorComponent,
    OrderSummaryComponent
  ],
  templateUrl: './create-order.component.html',
  styleUrls: ['./create-order.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CreateOrderComponent implements OnInit, OnDestroy {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly customerService = inject(CustomerService);
  private readonly productService = inject(ProductService);
  private readonly orderService = inject(OrderService);
  public readonly mapService = inject(MapService);
  private readonly notificationService = inject(NotificationService);
  private readonly loadingService = inject(LoadingService);
  private readonly destroy$ = new Subject<void>();

  @ViewChild(MapSelectorComponent) mapSelector!: MapSelectorComponent;

  // Forms - CAMBIO: Inicializar inmediatamente
  orderForm: FormGroup | undefined;
  isSubmitting = false;

  // Data
  customers: CustomerListItem[] = [];
  products: ProductListItem[] = [];
  
  // Calculations
  calculatedDistance: number | null = null;
  calculatedCost: number | null = null;
  distanceInterval: string | null = null;

  // Form validation state
  isFormValid = false;
  validationErrors: string[] = [];

  // Step state
  currentStep = 0;
  readonly QUANTITY_LIMITS = QUANTITY_LIMITS;

  // CAMBIO: Mover inicialización al constructor
  constructor() {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadData();
    this.setupFormSubscriptions();
    this.setupMapSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.mapService.clearSelectedCoordinates();
  }

  /**
   * Inicializa el formulario con validaciones - MEJORADO
   */
  private initializeForm(): void {
    try {
      this.orderForm = this.formBuilder.group({
        customerId: ['', [Validators.required]],
        productId: ['', [Validators.required]],
        quantity: [1, [
          Validators.required, 
          Validators.min(QUANTITY_LIMITS.min),
          Validators.max(QUANTITY_LIMITS.max)
        ]],
        origin: this.formBuilder.group({
          latitude: ['', [Validators.required, this.coordinateValidator]],
          longitude: ['', [Validators.required, this.coordinateValidator]]
        }),
        destination: this.formBuilder.group({
          latitude: ['', [Validators.required, this.coordinateValidator]],
          longitude: ['', [Validators.required, this.coordinateValidator]]
        })
      });

      console.log('Form initialized successfully:', this.orderForm);
    } catch (error) {
      console.error('Error initializing form:', error);
      // Fallback form mínimo
      this.orderForm = this.formBuilder.group({
        customerId: [''],
        productId: [''],
        quantity: [1],
        origin: this.formBuilder.group({
          latitude: [''],
          longitude: ['']
        }),
        destination: this.formBuilder.group({
          latitude: [''],
          longitude: ['']
        })
      });
    }
  }

  /**
   * Carga datos iniciales
   */
  private loadData(): void {
    // Cargar clientes
    this.customerService.getCustomersForDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (customers) => {
          this.customers = customers;
        },
        error: (error) => {
          console.error('Error loading customers:', error);
          this.notificationService.error('Error al cargar clientes');
        }
      });

    // Cargar productos
    this.productService.getProductsForDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.products = products;
        },
        error: (error) => {
          console.error('Error loading products:', error);
          this.notificationService.error('Error al cargar productos');
        }
      });
  }

  /**
   * Configura subscripciones del formulario - MEJORADO CON GUARDS
   */
  private setupFormSubscriptions(): void {
    // CAMBIO: Verificar que el formulario existe antes de suscribirse
    if (!this.orderForm) {
      console.warn('Form not initialized, skipping subscriptions');
      return;
    }

    try {
      // Suscripción a cambios en coordenadas para cálculo automático
      const originGroup = this.orderForm.get('origin');
      const destinationGroup = this.orderForm.get('destination');

      if (originGroup && destinationGroup) {
        combineLatest([
          originGroup.valueChanges.pipe(startWith(originGroup.value)),
          destinationGroup.valueChanges.pipe(startWith(destinationGroup.value))
        ])
        .pipe(
          debounceTime(500),
          distinctUntilChanged(),
          takeUntil(this.destroy$)
        )
        .subscribe(([origin, destination]) => {
          this.handleCoordinateChanges(origin, destination);
        });
      }

      // Suscripción a cambios generales del formulario para validación
      this.orderForm.valueChanges
        .pipe(
          debounceTime(300),
          takeUntil(this.destroy$)
        )
        .subscribe(() => {
          this.validateForm();
        });

    } catch (error) {
      console.error('Error setting up form subscriptions:', error);
    }
  }

  /**
   * Configura subscripciones del mapa
   */
  private setupMapSubscriptions(): void {
    // Suscripción a coordenadas seleccionadas del mapa
    this.mapService.selectedCoordinates$
      .pipe(takeUntil(this.destroy$))
      .subscribe((coordinates) => {
        if (coordinates && this.orderForm) {
          this.updateCoordinatesFromMap(coordinates);
        }
      });
  }

  /**
   * Maneja cambios en coordenadas - MEJORADO
   */
  private handleCoordinateChanges(origin: any, destination: any): void {
    try {
      // Validar que ambas coordenadas estén completas
      if (this.areCoordinatesValid(origin) && this.areCoordinatesValid(destination)) {
        this.calculateDistanceAndCost(origin, destination);
      } else {
        // Limpiar cálculos si las coordenadas no son válidas
        this.calculatedDistance = null;
        this.calculatedCost = null;
        this.distanceInterval = null;
      }
    } catch (error) {
      console.error('Error handling coordinate changes:', error);
    }
  }

  /**
   * Valida coordenadas - NUEVO MÉTODO
   */
  private areCoordinatesValid(coordinate: any): boolean {
    return coordinate && 
           coordinate.latitude && 
           coordinate.longitude &&
           !isNaN(parseFloat(coordinate.latitude)) &&
           !isNaN(parseFloat(coordinate.longitude));
  }

  /**
   * Calcula distancia y costo
   */
  private calculateDistanceAndCost(origin: Coordinate, destination: Coordinate): void {
    // Implementar cálculo de distancia y costo
    // Por ahora, valores mock para testing
    this.calculatedDistance = 15.5;
    this.calculatedCost = 25.00;
    this.distanceInterval = "10-20 km";
  }

  /**
   * Actualiza coordenadas desde el mapa
   */
  private updateCoordinatesFromMap(coordinates: { origin?: Coordinate; destination?: Coordinate }): void {
    try {
      if (this.orderForm != null && coordinates.origin && this.orderForm.get('origin')) {
        this.orderForm.get('origin')!.patchValue({
          latitude: coordinates.origin.latitude,
          longitude: coordinates.origin.longitude
        });
      }

      if (this.orderForm != null && coordinates.destination && this.orderForm.get('destination')) {
        this.orderForm.get('destination')!.patchValue({
          latitude: coordinates.destination.latitude,
          longitude: coordinates.destination.longitude
        });
      }
    } catch (error) {
      console.error('Error updating coordinates from map:', error);
    }
  }

  /**
   * Valida el formulario completo - NUEVO MÉTODO
   */
  private validateForm(): void {
    try {
      if (!this.orderForm) {
        this.isFormValid = false;
        return;
      }

      this.validationErrors = [];
      
      // Validar campos requeridos
      if (!this.orderForm.get('customerId')?.value) {
        this.validationErrors.push('Debe seleccionar un cliente');
      }
      
      if (!this.orderForm.get('productId')?.value) {
        this.validationErrors.push('Debe seleccionar un producto');
      }
      
      if (!this.orderForm.get('quantity')?.value || this.orderForm.get('quantity')?.value < 1) {
        this.validationErrors.push('La cantidad debe ser mayor a 0');
      }

      // Validar coordenadas
      const origin = this.orderForm.get('origin')?.value;
      const destination = this.orderForm.get('destination')?.value;
      
      if (!this.areCoordinatesValid(origin)) {
        this.validationErrors.push('Las coordenadas de origen son requeridas');
      }
      
      if (!this.areCoordinatesValid(destination)) {
        this.validationErrors.push('Las coordenadas de destino son requeridas');
      }

      this.isFormValid = this.validationErrors.length === 0 && this.orderForm.valid;
    } catch (error) {
      console.error('Error validating form:', error);
      this.isFormValid = false;
    }
  }

  /**
   * Validador personalizado para coordenadas
   */
  private coordinateValidator(control: any) {
    const value = control.value;
    if (!value) return null;
    
    const num = parseFloat(value);
    if (isNaN(num)) {
      return { invalidCoordinate: true };
    }
    
    return null;
  }

  /**
   * Envía el formulario
   */
  onSubmit(): void {
    if (!this.orderForm || this.orderForm.invalid || this.isSubmitting) {
      this.validateForm(); // Mostrar errores
      return;
    }

    this.isSubmitting = true;

    try {
      const formValue = this.orderForm.value;
      const request: CreateOrderRequest = {
        customerId: formValue.customerId,
        productId: formValue.productId,
        quantity: formValue.quantity,
        origin: formValue.origin,
        destination: formValue.destination
      };

      this.orderService.createOrder(request)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.notificationService.success('Orden creada exitosamente');
              this.router.navigate(['/orders']);
            } else {
              this.notificationService.error(response.message || 'Error al crear la orden');
            }
            this.isSubmitting = false;
          },
          error: (error) => {
            this.notificationService.error('Error al crear la orden');
            console.error('Error creating order:', error);
            this.isSubmitting = false;
          }
        });
    } catch (error) {
      console.error('Error submitting form:', error);
      this.notificationService.error('Error al procesar el formulario');
      this.isSubmitting = false;
    }
  }

  /**
   * Cancela y vuelve a la lista
   */
  onCancel(): void {
    this.router.navigate(['/orders']);
  }

  /**
   * Track by functions para mejorar performance
   */
  trackByCustomerId(index: number, customer: CustomerListItem): string {
    return customer.id;
  }

  trackByProductId(index: number, product: ProductListItem): string {
    return product.id;
  }

  /**
   * Getters para acceder a controles del formulario de forma segura
   */
  get customerIdControl() {
    return this.orderForm?.get('customerId');
  }

  get productIdControl() {
    return this.orderForm?.get('productId');
  }

  get quantityControl() {
    return this.orderForm?.get('quantity');
  }

  get originGroup() {
    return this.orderForm?.get('origin') as FormGroup;
  }

  get destinationGroup() {
    return this.orderForm?.get('destination') as FormGroup;
  }

  /**
   * Verifica si el formulario está listo para usar
   */
  get isFormReady(): boolean {
    return !!this.orderForm;
  }

  /**
   * Métodos para el template - NUEVOS MÉTODOS FALTANTES
   */

  /**
   * Obtiene el nombre del cliente seleccionado
   */
  getSelectedCustomerName(): string {
    const customerId = this.customerIdControl?.value;
    if (!customerId || this.customers.length === 0) return '';
    
    const customer = this.customers.find(c => c.id === customerId);
    return customer ? customer.name : '';
  }

  /**
   * Obtiene el producto seleccionado
   */
  getSelectedProduct(): ProductListItem | null {
    const productId = this.productIdControl?.value;
    if (!productId || this.products.length === 0) return null;
    
    return this.products.find(p => p.id === productId) || null;
  }

  /**
   * Calcula el total de la orden
   */
  getOrderTotal(): number {
    const product = this.getSelectedProduct();
    const quantity = this.quantityControl?.value || 0;
    const shippingCost = this.calculatedCost || 0;
    
    if (!product) return shippingCost;
    
    const productTotal = product.unitPrice * quantity;
    return productTotal + shippingCost;
  }

  /**
   * Establece coordenadas predefinidas de Lima
   */
  setLimaCoordinates(target: 'origin' | 'destination'): void {
    try {
      const coordinates = this.getLimaCoordinates();
      const targetGroup = target === 'origin' ? this.originGroup : this.destinationGroup;
      
      if (targetGroup) {
        targetGroup.patchValue({
          latitude: coordinates.latitude,
          longitude: coordinates.longitude
        });
      }
    } catch (error) {
      console.error('Error setting Lima coordinates:', error);
    }
  }

  /**
   * Obtiene coordenadas predefinidas de Lima
   */
  private getLimaCoordinates(): Coordinate {
    // Coordenadas del centro de Lima, Perú
    return {
      latitude: -12.0464,
      longitude: -77.0428
    };
  }

  /**
   * Establece coordenadas predefinidas del Callao
   */
  setCallaoCoordinates(target: 'origin' | 'destination'): void {
    try {
      const coordinates = this.getCallaoCoordinates();
      const targetGroup = target === 'origin' ? this.originGroup : this.destinationGroup;
      
      if (targetGroup) {
        targetGroup.patchValue({
          latitude: coordinates.latitude,
          longitude: coordinates.longitude
        });
      }
    } catch (error) {
      console.error('Error setting Callao coordinates:', error);
    }
  }

  /**
   * Obtiene coordenadas predefinidas del Callao
   */
  private getCallaoCoordinates(): Coordinate {
    // Coordenadas del Callao, Perú
    return {
      latitude: -12.0566,
      longitude: -77.1181
    };
  }

  /**
   * Establece coordenadas predefinidas de Miraflores
   */
  setMirafloresCoordinates(target: 'origin' | 'destination'): void {
    try {
      const coordinates = this.getMirafloresCoordinates();
      const targetGroup = target === 'origin' ? this.originGroup : this.destinationGroup;
      
      if (targetGroup) {
        targetGroup.patchValue({
          latitude: coordinates.latitude,
          longitude: coordinates.longitude
        });
      }
    } catch (error) {
      console.error('Error setting Miraflores coordinates:', error);
    }
  }

  /**
   * Obtiene coordenadas predefinidas de Miraflores
   */
  private getMirafloresCoordinates(): Coordinate {
    // Coordenadas de Miraflores, Lima
    return {
      latitude: -12.1214,
      longitude: -77.0284
    };
  }

  /**
   * Establece coordenadas predefinidas de San Isidro
   */
  setSanIsidroCoordinates(target: 'origin' | 'destination'): void {
    try {
      const coordinates = this.getSanIsidroCoordinates();
      const targetGroup = target === 'origin' ? this.originGroup : this.destinationGroup;
      
      if (targetGroup) {
        targetGroup.patchValue({
          latitude: coordinates.latitude,
          longitude: coordinates.longitude
        });
      }
    } catch (error) {
      console.error('Error setting San Isidro coordinates:', error);
    }
  }

  /**
   * Obtiene coordenadas predefinidas de San Isidro
   */
  private getSanIsidroCoordinates(): Coordinate {
    // Coordenadas de San Isidro, Lima
    return {
      latitude: -12.0975,
      longitude: -77.0364
    };
  }
}