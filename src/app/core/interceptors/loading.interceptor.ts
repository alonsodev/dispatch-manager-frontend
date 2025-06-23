import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);

  // Incrementar contador de requests activos
  loadingService.show();

  return next(req).pipe(
    finalize(() => {
      // Decrementar contador al finalizar el request
      loadingService.hide();
    })
  );
};