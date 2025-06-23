import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from './api.service';
import { 
  OrdersReport, 
  ReportRequest, 
  ReportMetrics,
  ChartData,
  BaseResponse 
} from '@core/models';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private readonly apiService = inject(ApiService);

  /**
   * Obtiene reporte completo de órdenes
   */
  getOrdersReport(request: ReportRequest = {}): Observable<BaseResponse<OrdersReport>> {
    const params: Record<string, string> = {};
    
    if (request.customerId) params['customerId'] = request.customerId;
    if (request.startDate) params['startDate'] = request.startDate;
    if (request.endDate) params['endDate'] = request.endDate;
    if (request.distanceInterval) params['distanceInterval'] = request.distanceInterval;
    if (request.includeGlobalSummary !== undefined) {
      params['includeGlobalSummary'] = request.includeGlobalSummary.toString();
    }

    return this.apiService.get<BaseResponse<OrdersReport>>('orders/report', params);
  }

  /**
   * Exporta reporte a Excel
   */
  exportOrdersReportExcel(request: ReportRequest = {}): Observable<Blob> {
    const params: Record<string, string> = {
      ...this.buildReportParams(request),
      exportFormat: 'excel'
    };

    return this.apiService.getBlob<Blob>('orders/report/excel', params, { responseType: 'blob' });
  }

  /**
   * Exporta reporte a CSV
   */
  exportOrdersReportCsv(request: ReportRequest = {}): Observable<Blob> {
    const params: Record<string, string> = {
      ...this.buildReportParams(request),
      exportFormat: 'csv'
    };

    return this.apiService.get<Blob>('orders/report/export', params);
  }

  /**
   * Obtiene métricas principales del dashboard
   */
  getDashboardMetrics(): Observable<ReportMetrics> {
    return this.apiService.get<BaseResponse<ReportMetrics>>('orders/metrics')
      .pipe(
        map(response => response.data || {} as ReportMetrics)
      );
  }

  /**
   * Obtiene datos para gráfico de distribución por intervalos
   */
  getDistanceIntervalChart(): Observable<ChartData> {
    return this.getOrdersReport({ includeGlobalSummary: true })
      .pipe(
        map(response => {
          const data = response.data;
          if (!data) return { labels: [], datasets: [] };

          const labels = Object.keys(data.globalIntervalCounts);
          const values = Object.values(data.globalIntervalCounts);

          return {
            labels,
            datasets: [{
              label: 'Órdenes por Intervalo de Distancia',
              data: values,
              backgroundColor: [
                '#4CAF50', // 1-50 km
                '#FF9800', // 51-200 km  
                '#2196F3', // 201-500 km
                '#9C27B0'  // 501-1000 km
              ],
              borderWidth: 0
            }]
          };
        })
      );
  }

  /**
   * Obtiene datos para gráfico de órdenes por cliente
   */
  getCustomerOrdersChart(): Observable<ChartData> {
    return this.getOrdersReport()
      .pipe(
        map(response => {
          const data = response.data;
          if (!data || !data.customerReports) return { labels: [], datasets: [] };

          const topCustomers = data.customerReports
            .sort((a, b) => b.totalOrders - a.totalOrders)
            .slice(0, 10);

          return {
            labels: topCustomers.map(c => c.customerName),
            datasets: [{
              label: 'Órdenes por Cliente',
              data: topCustomers.map(c => c.totalOrders),
              backgroundColor: '#2196F3',
              borderColor: '#1976D2',
              borderWidth: 1
            }]
          };
        })
      );
  }

  /**
   * Construye parámetros para reportes
   */
  private buildReportParams(request: ReportRequest): Record<string, string> {
    const params: Record<string, string> = {};
    
    if (request.customerId) params['customerId'] = request.customerId;
    if (request.startDate) params['startDate'] = request.startDate;
    if (request.endDate) params['endDate'] = request.endDate;
    if (request.distanceInterval) params['distanceInterval'] = request.distanceInterval;
    
    return params;
  }
}
