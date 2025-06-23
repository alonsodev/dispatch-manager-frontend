import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { ApiService } from './api.service';
import { 
  Order, 
  CreateOrderRequest, 
  OrderListItem, 
  UpdateOrderStatusRequest,
  OrdersSearchParams,
  BaseResponse, 
  PagedResponse,
  OrderStatus,
  Coordinate 
} from '@core/models';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly apiService = inject(ApiService);
  private readonly ordersSubject = new BehaviorSubject<OrderListItem[]>([]);
  
  readonly orders$ = this.ordersSubject.asObservable();

  /**
   * Obtiene lista paginada de órdenes con filtros
   */
  getOrders(params: OrdersSearchParams): Observable<PagedResponse<OrderListItem>> {
    const queryParams: Record<string, string> = {
      pageNumber: params.pageNumber.toString(),
      pageSize: params.pageSize.toString()
    };

    if (params.customerId) queryParams['customerId'] = params.customerId;
    if (params.status !== undefined) queryParams['status'] = params.status.toString();
    if (params.startDate) queryParams['startDate'] = params.startDate;
    if (params.endDate) queryParams['endDate'] = params.endDate;
    if (params.minDistance) queryParams['minDistance'] = params.minDistance.toString();
    if (params.maxDistance) queryParams['maxDistance'] = params.maxDistance.toString();
    if (params.searchTerm) queryParams['searchTerm'] = params.searchTerm;
    if (params.sortBy) {
      queryParams['sortBy'] = params.sortBy;
      queryParams['sortDirection'] = params.sortDirection || 'desc';
    }

    return this.apiService.get<PagedResponse<OrderListItem>>('orders', queryParams)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.ordersSubject.next(response.data);
          }
        })
      );
  }

  /**
   * Obtiene una orden por ID con detalles completos
   */
  getOrderById(id: string): Observable<BaseResponse<Order>> {
    return this.apiService.get<BaseResponse<Order>>(`orders/${id}`);
  }

  /**
   * Obtiene órdenes por cliente ID
   */
  getOrdersByCustomer(customerId: string, pageNumber = 1, pageSize = 20): Observable<PagedResponse<OrderListItem>> {
    return this.getOrders({ 
      customerId, 
      pageNumber, 
      pageSize,
      sortBy: 'CreatedAt',
      sortDirection: 'desc'
    });
  }

  /**
   * Crea una nueva orden
   */
  createOrder(order: CreateOrderRequest): Observable<BaseResponse<Order>> {
    return this.apiService.post<BaseResponse<Order>>('orders', order)
      .pipe(
        tap(response => {
          if (response.success) {
            this.refreshOrdersList();
          }
        })
      );
  }

  /**
   * Actualiza el estado de una orden
   */
  updateOrderStatus(request: UpdateOrderStatusRequest): Observable<BaseResponse<Order>> {
    return this.apiService.patch<BaseResponse<Order>>(`orders/${request.orderId}/status`, request)
      .pipe(
        tap(response => {
          if (response.success) {
            this.refreshOrdersList();
          }
        })
      );
  }

  /**
   * Calcula distancia entre dos coordenadas
   */
  calculateDistance(origin: Coordinate, destination: Coordinate): Observable<BaseResponse<number>> {
    return this.apiService.post<BaseResponse<number>>('orders/calculate-distance', {
      origin,
      destination
    });
  }

  /**
   * Calcula costo basado en distancia
   */
  calculateCost(distanceKm: number): Observable<BaseResponse<number>> {
    return this.apiService.get<BaseResponse<number>>('orders/calculate-cost', {
      distance: distanceKm.toString()
    });
  }

  /**
   * Valida coordenadas antes de crear orden
   */
  validateCoordinates(origin: Coordinate, destination: Coordinate): Observable<BaseResponse<boolean>> {
    return this.apiService.post<BaseResponse<boolean>>('orders/validate-coordinates', {
      origin,
      destination
    });
  }

  /**
   * Obtiene estadísticas de órdenes
   */
  getOrderStats(): Observable<BaseResponse<any>> {
    return this.apiService.get<BaseResponse<any>>('orders/stats');
  }

  /**
   * Refresca la lista de órdenes en caché
   */
  private refreshOrdersList(): void {
    this.getOrders({ pageNumber: 1, pageSize: 50 }).subscribe();
  }
}