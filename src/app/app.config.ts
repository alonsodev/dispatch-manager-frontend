import { ApplicationConfig, importProvidersFrom, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideToastr } from 'ngx-toastr';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { routes } from './app.routes';
import { apiInterceptor } from './core/interceptors/api.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { configureChartJS } from '@core/config/chart.config';

// Factory function para inicializar Chart.js
function initializeChartJS(): void {
  console.log('🚀 Inicializando Chart.js...');
  configureChartJS();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    
    provideAppInitializer(initializeChartJS),
    // Routing
    provideRouter(routes),
    
    // HTTP Client con interceptors
    provideHttpClient(
      withInterceptors([
        apiInterceptor,
        errorInterceptor,
        loadingInterceptor
      ])
    ),
    
    // Animations
    provideAnimationsAsync(),
    
    // Toastr para notificaciones
    provideToastr({
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
      progressBar: true,
      closeButton: true
    }),
    
    // Material Dialog y SnackBar
    importProvidersFrom(
      MatDialogModule,
      MatSnackBarModule
    )
  ]
};