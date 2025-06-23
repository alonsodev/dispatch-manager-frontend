import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { ApiService } from './api.service';
import { 
  Customer, 
  CreateCustomerRequest, 
  CustomerListItem, 
  UpdateCustomerRequest,
  BaseResponse, 
  PagedResponse,
  SearchParams 
} from '@core/models';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private readonly apiService = inject(ApiService);
  private readonly customersSubject = new BehaviorSubject<CustomerListItem[]>([]);
  
  readonly customers$ = this.customersSubject.asObservable();

  /**
   * Obtiene lista paginada de clientes con búsqueda opcional
   */
  getCustomers(params: SearchParams): Observable<PagedResponse<CustomerListItem>> {
    const queryParams: Record<string, string> = {
      pageNumber: params.pageNumber.toString(),
      pageSize: params.pageSize.toString()
    };

    if (params.searchTerm) {
      queryParams['searchTerm'] = params.searchTerm;
    }

    if (params.sortBy) {
      queryParams['sortBy'] = params.sortBy;
      queryParams['sortDirection'] = params.sortDirection || 'asc';
    }

    return this.apiService.get<PagedResponse<CustomerListItem>>('customers', queryParams)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.customersSubject.next(response.data);
          }
        })
      );
  }

  /**
   * Obtiene un cliente por ID
   */
  getCustomerById(id: string): Observable<BaseResponse<Customer>> {
    return this.apiService.get<BaseResponse<Customer>>(`customers/${id}`);
  }

  /**
   * Obtiene lista simple de clientes para dropdowns
   */
  getCustomersForDropdown(): Observable<CustomerListItem[]> {
    return this.apiService.get<BaseResponse<CustomerListItem[]>>('customers/list')
      .pipe(
        map(response => response.data || [])
      );
  }

  /**
   * Crea un nuevo cliente
   */
  createCustomer(customer: CreateCustomerRequest): Observable<BaseResponse<Customer>> {
    return this.apiService.post<BaseResponse<Customer>>('customers', customer)
      .pipe(
        tap(response => {
          if (response.success) {
            this.refreshCustomersList();
          }
        })
      );
  }

  /**
   * Actualiza un cliente existente
   */
  updateCustomer(customer: UpdateCustomerRequest): Observable<BaseResponse<Customer>> {
    return this.apiService.put<BaseResponse<Customer>>(`customers/${customer.id}`, customer)
      .pipe(
        tap(response => {
          if (response.success) {
            this.refreshCustomersList();
          }
        })
      );
  }

  /**
   * Elimina un cliente
   */
  deleteCustomer(id: string): Observable<BaseResponse<void>> {
    return this.apiService.delete<BaseResponse<void>>(`customers/${id}`)
      .pipe(
        tap(response => {
          if (response.success) {
            this.refreshCustomersList();
          }
        })
      );
  }

  /**
   * Verifica si un email ya existe
   */
  checkEmailExists(email: string): Observable<boolean> {
    return this.apiService.get<BaseResponse<boolean>>('customers/check-email', { email })
      .pipe(
        map(response => response.data || false)
      );
  }

  /**
   * Refresca la lista de clientes en caché
   */
  private refreshCustomersList(): void {
    this.getCustomers({ pageNumber: 1, pageSize: 100 }).subscribe();
  }
}