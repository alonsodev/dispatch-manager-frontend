import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '@environments/environment';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  // Agregar headers comunes
  const apiReq = req.clone({
    setHeaders: {
      'Content-Type': 'application/json',
      'X-API-Version': '1.0'
    }
  });

  return next(apiReq);
};