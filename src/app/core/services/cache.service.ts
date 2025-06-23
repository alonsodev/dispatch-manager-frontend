import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Servicio para manejar operaciones de caché
 * Diseñado siguiendo principios de Clean Architecture
 */
@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/cache`;

  /**
   * Invalida toda la caché del sistema
   * @returns Promise que se resuelve cuando se completa la invalidación
   */
  async invalidateAllCache(): Promise<void> {
    try {
      const response$ = this.http.delete<ApiResponse<void>>(`${this.baseUrl}/invalidate-all`, {
        headers: this.getHeaders()
      });

      // Opcional: Limpiar caché local del navegador también
      this.clearLocalCache();

    } catch (error) {
      console.error('Cache invalidation failed:', error);
      throw error;
    }
  }
  
  /**
   * Limpia caché local del navegador (opcional)
   */
  private clearLocalCache(): void {
    try {
      // Limpiar caché del navegador si es necesario
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            if (name.includes('dispatch-manager')) {
              caches.delete(name);
            }
          });
        });
      }

      // Opcional: Limpiar localStorage específico
      const keysToRemove = Object.keys(localStorage)
        .filter(key => key.startsWith('dm_cache_') || key.startsWith('dispatch_'));
      
      keysToRemove.forEach(key => localStorage.removeItem(key));

    } catch (error) {
      console.warn('Could not clear local cache:', error);
    }
  }

  /**
   * Headers estándar para peticiones
   */
  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-API-Version': '1.0',
      'X-Client': 'DispatchManager-Angular'
    };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// INTERFACES
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Respuesta estándar de la API
 */
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

/**
 * Estadísticas de caché
 */
interface CacheStats {
  totalKeys: number;
  totalMemoryUsage: string;
  hitRate: number;
  missRate: number;
  tags: CacheTagInfo[];
}

/**
 * Información de tag de caché
 */
interface CacheTagInfo {
  tag: string;
  keyCount: number;
  lastAccessed: Date;
}