import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

import { environment } from '@environments/environment';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly notificationService = inject(NotificationService);
  private readonly baseUrl = environment.apiUrl;

  /**
   * Realiza petición GET con manejo de errores
   */
  get<T>(endpoint: string, params?: Record<string, string>): Observable<T> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.append(key, params[key]);
        }
      });
    }
    
    return this.http.get<T>(`${this.baseUrl}/${endpoint}`, { 
      params: httpParams,
      headers: this.getHeaders()
    }).pipe(
      timeout(environment.apiTimeout),
      catchError(error => this.handleError(error))
    );
  }

  getBlob<T>(
    endpoint: string, 
    params?: Record<string, string>, 
    options?: { responseType?: 'json' | 'blob' | 'text' }
  ): Observable<T> | Observable<Blob> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.append(key, params[key]);
        }
      });
    }

    const baseOptions = {
      headers: this.getHeaders(),
      params: httpParams
    };

    const url = `${this.baseUrl}/${endpoint}`;
    
    // Manejo específico por tipo de respuesta
    if (options?.responseType === 'blob') {
      return this.http.get(url, { ...baseOptions, responseType: 'blob' })
        .pipe(
          timeout(environment.apiTimeout),
          catchError(error => this.handleError(error))
        );
    }
    
    // Por defecto JSON
    return this.http.get<T>(url, baseOptions)
      .pipe(
        timeout(environment.apiTimeout),
        catchError(error => this.handleError(error))
      );
  }
  

  /**
   * Realiza petición POST con manejo de errores
   */
  post<T>(endpoint: string, data: unknown): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}/${endpoint}`, data, {
      headers: this.getHeaders()
    }).pipe(
      timeout(environment.apiTimeout),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Realiza petición PUT con manejo de errores
   */
  put<T>(endpoint: string, data: unknown): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}/${endpoint}`, data, {
      headers: this.getHeaders()
    }).pipe(
      timeout(environment.apiTimeout),
      catchError(error => this.handleError(error))
    );
  }

  patch<T>(endpoint: string, data: unknown): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}/${endpoint}`, data, {
      headers: this.getHeaders()
    }).pipe(
      timeout(environment.apiTimeout),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Realiza petición DELETE con manejo de errores
   */
  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}/${endpoint}`, {
      headers: this.getHeaders()
    }).pipe(
      timeout(environment.apiTimeout),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Descarga archivo (para reportes)
   */
  downloadFile(endpoint: string, params?: Record<string, string>): Observable<Blob> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.append(key, params[key]);
        }
      });
    }

    return this.http.get(`${this.baseUrl}/${endpoint}`, {
      params: httpParams,
      headers: this.getHeaders(),
      responseType: 'blob',
      observe: 'body'
    }).pipe(
      timeout(environment.apiTimeout * 2), // Más tiempo para descargas
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Obtiene headers estándar para las peticiones
   */
  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-API-Version': '1.0',
      'X-Client': 'DispatchManager-Angular'
    };
  }

  /**
   * Maneja errores de la API de manera centralizada
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocurrió un error inesperado';
    let shouldShowNotification = true;

    // Errores de red o timeout
    if (error.status === 0) {
      errorMessage = 'Error de conexión. Verifique su conexión a internet.';
    }
    // Errores del servidor
    else if (error.status >= 500) {
      errorMessage = 'Error interno del servidor. Intente nuevamente más tarde.';
    }
    // Errores del cliente
    else if (error.status >= 400) {
      // Si el backend devuelve un BaseResponse con errores
      if (error.error?.success === false) {
        errorMessage = error.error.message || 'Error en la solicitud';
        
        // Si hay errores de validación específicos
        if (error.error.errors?.length > 0) {
          errorMessage = error.error.errors.join('. ');
        }
      }
      // Errores estándar HTTP
      else {
        switch (error.status) {
          case 400:
            errorMessage = 'Solicitud inválida. Verifique los datos enviados.';
            break;
          case 401:
            errorMessage = 'Sesión expirada. Por favor, inicie sesión nuevamente.';
            shouldShowNotification = false; // Se maneja en el interceptor
            break;
          case 403:
            errorMessage = 'No tiene permisos para realizar esta acción.';
            break;
          case 404:
            errorMessage = 'El recurso solicitado no fue encontrado.';
            break;
          case 409:
            errorMessage = 'El recurso ya existe o hay un conflicto.';
            break;
          case 422:
            errorMessage = 'Los datos enviados no son válidos.';
            break;
        }
      }
    }

    // Mostrar notificación solo si es necesario
    if (shouldShowNotification && environment.production === false) {
      this.notificationService.error(errorMessage);
    }

    // Log del error para debugging
    if (!environment.production) {
      console.error('API Error:', {
        status: error.status,
        message: error.message,
        url: error.url,
        error: error.error
      });
    }

    return throwError(() => ({
      statusCode: error.status,
      message: errorMessage,
      details: error.error?.errors || [],
      originalError: error
    }));
  }
}