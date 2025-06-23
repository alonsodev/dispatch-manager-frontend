import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { ApiService } from './api.service';
import { 
  Product, 
  CreateProductRequest, 
  ProductListItem, 
  UpdateProductRequest,
  BaseResponse, 
  PagedResponse,
  SearchParams 
} from '@core/models';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly apiService = inject(ApiService);
  private readonly productsSubject = new BehaviorSubject<ProductListItem[]>([]);
  
  readonly products$ = this.productsSubject.asObservable();

  /**
   * Obtiene lista paginada de productos con búsqueda opcional
   */
  getProducts(params: SearchParams): Observable<PagedResponse<ProductListItem>> {
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

    return this.apiService.get<PagedResponse<ProductListItem>>('products', queryParams)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.productsSubject.next(response.data);
          }
        })
      );
  }

  /**
   * Obtiene un producto por ID
   */
  getProductById(id: string): Observable<BaseResponse<Product>> {
    return this.apiService.get<BaseResponse<Product>>(`products/${id}`);
  }

  /**
   * Obtiene lista simple de productos para dropdowns
   */
  getProductsForDropdown(): Observable<ProductListItem[]> {
    return this.apiService.get<BaseResponse<ProductListItem[]>>('products/list')
      .pipe(
        map(response => response.data || [])
      );
  }

  /**
   * Busca productos por precio
   */
  getProductsByPriceRange(minPrice?: number, maxPrice?: number): Observable<ProductListItem[]> {
    const params: Record<string, string> = {};
    
    if (minPrice !== undefined) params['minPrice'] = minPrice.toString();
    if (maxPrice !== undefined) params['maxPrice'] = maxPrice.toString();

    return this.apiService.get<BaseResponse<ProductListItem[]>>('products/by-price', params)
      .pipe(
        map(response => response.data || [])
      );
  }

  /**
   * Crea un nuevo producto
   */
  createProduct(product: CreateProductRequest): Observable<BaseResponse<Product>> {
    return this.apiService.post<BaseResponse<Product>>('products', product)
      .pipe(
        tap(response => {
          if (response.success) {
            this.refreshProductsList();
          }
        })
      );
  }

  /**
   * Actualiza un producto existente
   */
  updateProduct(product: UpdateProductRequest): Observable<BaseResponse<Product>> {
    return this.apiService.put<BaseResponse<Product>>(`products/${product.id}`, product)
      .pipe(
        tap(response => {
          if (response.success) {
            this.refreshProductsList();
          }
        })
      );
  }

  /**
   * Elimina un producto
   */
  deleteProduct(id: string): Observable<BaseResponse<void>> {
    return this.apiService.delete<BaseResponse<void>>(`products/${id}`)
      .pipe(
        tap(response => {
          if (response.success) {
            this.refreshProductsList();
          }
        })
      );
  }

  /**
   * Refresca la lista de productos en caché
   */
  private refreshProductsList(): void {
    this.getProducts({ pageNumber: 1, pageSize: 100 }).subscribe();
  }
}