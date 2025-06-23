import { Injectable, inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

export interface NotificationOptions {
  title?: string;
  timeout?: number;
  enableHtml?: boolean;
  closeButton?: boolean;
  progressBar?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly toastr = inject(ToastrService);

  /**
   * Muestra notificación de éxito
   */
  success(message: string, options: NotificationOptions = {}): void {
    this.toastr.success(message, options.title || 'Éxito', {
      timeOut: options.timeout || 3000,
      enableHtml: options.enableHtml || false,
      closeButton: options.closeButton ?? true,
      progressBar: options.progressBar ?? true,
      positionClass: 'toast-top-right'
    });
  }

  /**
   * Muestra notificación de error
   */
  error(message: string, options: NotificationOptions = {}): void {
    this.toastr.error(message, options.title || 'Error', {
      timeOut: options.timeout || 5000,
      enableHtml: options.enableHtml || false,
      closeButton: options.closeButton ?? true,
      progressBar: options.progressBar ?? true,
      positionClass: 'toast-top-right'
    });
  }

  /**
   * Muestra notificación de advertencia
   */
  warning(message: string, options: NotificationOptions = {}): void {
    this.toastr.warning(message, options.title || 'Advertencia', {
      timeOut: options.timeout || 4000,
      enableHtml: options.enableHtml || false,
      closeButton: options.closeButton ?? true,
      progressBar: options.progressBar ?? true,
      positionClass: 'toast-top-right'
    });
  }

  /**
   * Muestra notificación informativa
   */
  info(message: string, options: NotificationOptions = {}): void {
    this.toastr.info(message, options.title || 'Información', {
      timeOut: options.timeout || 3000,
      enableHtml: options.enableHtml || false,
      closeButton: options.closeButton ?? true,
      progressBar: options.progressBar ?? true,
      positionClass: 'toast-top-right'
    });
  }

  /**
   * Limpia todas las notificaciones activas
   */
  clear(): void {
    this.toastr.clear();
  }
}