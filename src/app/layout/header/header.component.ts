import { Component, EventEmitter, inject, Output, ViewEncapsulation } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { Router, RouterModule } from '@angular/router';
import { encapsulateStyle } from '@angular/compiler';
import { NotificationService } from '@core/services';
import { CacheService } from '@core/services/cache.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    RouterModule
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class HeaderComponent {
  @Output() menuToggle = new EventEmitter<void>();
  private readonly cacheService = inject(CacheService);
  private readonly notificationService = inject(NotificationService);

  isCacheInvalidating = false;

  currentUser = {
    name: 'Usuario Demo',
    email: 'demo@dispatchmanager.com',
    role: 'Administrador',
    avatar: null
  };

  constructor(private router: Router) {}

  onMenuToggle(): void {
    this.menuToggle.emit();
  }

  async onInvalidateCache(): Promise<void> {
    if (this.isCacheInvalidating) return;

    try {
      this.isCacheInvalidating = true;
      
      // Llamada al servicio
      await this.cacheService.invalidateAllCache();
      
      // Feedback positivo al usuario
      this.notificationService.success(
        'Caché invalidada exitosamente'
      );

      // Opcional: Recargar datos críticos inmediatamente
      this.refreshCriticalData();

    } catch (error) {
      console.error('Error invalidating cache:', error);
      this.notificationService.error(
        'Error al invalidar caché'
      );
    } finally {
      // Dar tiempo para que el usuario vea el feedback
      setTimeout(() => {
        this.isCacheInvalidating = false;
      }, 1500);
    }
  }

  private refreshCriticalData(): void {
    this.router.navigateByUrl('/', { replaceUrl: true }).then(() => {
      // 2) Forzamos recarga completa desde el servidor
      //    el true en reload(true) pide recarga ignorando caché (depende del navegador)
      (window.location as any).reload(true);
    });
    console.log('Refreshing critical data after cache invalidation...');
  }

  onProfile(): void {
    console.log('Navegar a perfil');
    // TODO: Implementar navegación a perfil
  }

  onSettings(): void {
    console.log('Navegar a configuración');
    // TODO: Implementar navegación a configuración
  }

  onLogout(): void {
    console.log('Cerrar sesión');
    // TODO: Implementar logout
  }
}