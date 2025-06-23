import { Component, OnInit, OnDestroy, ViewChild, inject, ViewEncapsulation, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';

// Chart.js
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartType } from 'chart.js';

// Services y Models
import { 
  ReportService, 
  CustomerService, 
  NotificationService,
  LoadingService 
} from '@core/services';
import { 
  OrdersReport, 
  CustomerListItem, 
  ReportRequest, 
  ReportMetrics,
  ChartData,
  DistanceIntervalColors 
} from '@core/models';
import { DateUtil } from '@core/utils/date.util';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    BaseChartDirective
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly formBuilder = inject(FormBuilder);
  private readonly reportService = inject(ReportService);
  private readonly customerService = inject(CustomerService);
  private readonly notificationService = inject(NotificationService);
  private readonly loadingService = inject(LoadingService);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('intervalChart') intervalChart!: BaseChartDirective;
  @ViewChild('customerChart') customerChart!: BaseChartDirective;

  // Forms
  filtersForm!: FormGroup;

  // Data
  customers: CustomerListItem[] = [];
  report: OrdersReport | null = null;
  metrics: ReportMetrics | null = null;

  // Charts
  intervalChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',   // Verde - corta distancia
        'rgba(59, 130, 246, 0.8)',  // Azul - media distancia  
        'rgba(245, 158, 11, 0.8)',  // Amarillo - larga distancia
        'rgba(239, 68, 68, 0.8)'    // Rojo - muy larga distancia
      ],
      borderColor: [
        'rgba(34, 197, 94, 1)',
        'rgba(59, 130, 246, 1)',
        'rgba(245, 158, 11, 1)',
        'rgba(239, 68, 68, 1)'
      ],
      borderWidth: 2
    }]
  };

  intervalChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            family: "'Inter', sans-serif",
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          family: "'Inter', sans-serif",
          size: 14
        },
        bodyFont: {
          family: "'Inter', sans-serif",
          size: 12
        },
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            return `${label}: ${value} órdenes (${percentage}%)`;
          }
        }
      }
    },
    cutout: '65%'
  };

  customerChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [{
      label: 'Órdenes por Cliente',
      data: [],
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 1,
      borderRadius: 4,
      borderSkipped: false
    }]
  };
  customerChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          family: "'Inter', sans-serif",
          size: 14
        },
        bodyFont: {
          family: "'Inter', sans-serif",
          size: 12
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            family: "'Inter', sans-serif",
            size: 11
          },
          maxRotation: 45
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          font: {
            family: "'Inter', sans-serif",
            size: 11
          },
          stepSize: 1
        }
      }
    },
    elements: {
      bar: {
        borderRadius: 4
      }
    }
  };

  // State
  isLoading = false;
  isExporting = false;

  // Chart types
  readonly intervalChartType: ChartType = 'doughnut';
  readonly customerChartType: ChartType = 'bar';

  ngOnInit(): void {
    this.initializeForm();
    //this.setupChartOptions();
    this.loadData();
    this.setupFormSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa el formulario de filtros
   */
  private initializeForm(): void {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    this.filtersForm = this.formBuilder.group({
      customerId: [''],
      startDate: [firstDayOfMonth],
      endDate: [now]
    });
  }

  /**
   * Configura opciones de los gráficos
   */
  private setupChartOptions(): void {
    // Configuración del gráfico de intervalos (donut)
    this.intervalChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              size: 14,
              family: 'SF Pro Text, -apple-system, BlinkMacSystemFont, Roboto, sans-serif'
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          cornerRadius: 8,
          titleFont: {
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            size: 13
          },
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value} órdenes (${percentage}%)`;
            }
          }
        }
      },
      cutout: '60%'
    };

    // Configuración del gráfico de clientes (barras)
    this.customerChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          cornerRadius: 8
        }
      },
      scales: {
        x: {
          ticks: {
            maxRotation: 45,
            font: {
              size: 12
            }
          },
          grid: {
            display: false
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            font: {
              size: 12
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        }
      }
    };
  }

  /**
   * Carga datos iniciales
   */
  private loadData(): void {
    this.isLoading = true;
    this.loadCustomers();
    this.loadReport();
    //this.loadMetrics();
  }

  /**
   * Configura subscripciones del formulario
   */
  private setupFormSubscriptions(): void {
    this.filtersForm.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.loadReport();
      });
  }

  /**
   * Carga lista de clientes
   */
  private loadCustomers(): void {
    this.customerService.getCustomersForDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (customers) => {
          this.customers = customers;
        },
        error: (error) => {
          console.error('Error loading customers:', error);
        }
      });
  }

  /**
   * Carga reporte de órdenes
   */
  private loadReport(): void {
    this.isLoading = true;
    
    const formValue = this.filtersForm.value;
    const request: ReportRequest = {
      customerId: formValue.customerId || undefined,
      startDate: formValue.startDate ? DateUtil.toInputFormat(formValue.startDate) : undefined,
      endDate: formValue.endDate ? DateUtil.toInputFormat(formValue.endDate) : undefined,
      includeGlobalSummary: true
    };

    this.reportService.getOrdersReport(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.report = response.data;
            this.updateCharts();
          } else {
            this.notificationService.error(response.message || 'Error al cargar el reporte');
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.notificationService.error('Error al cargar el reporte');
          console.error('Error loading report:', error);
          this.isLoading = false;
        }
      });
  }

  /**
   * Carga métricas del dashboard
   */
  private loadMetrics(): void {
    this.reportService.getDashboardMetrics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (metrics) => {
          this.metrics = metrics;
        },
        error: (error) => {
          console.error('Error loading metrics:', error);
        }
      });
  }

  /**
   * Actualiza los gráficos con nuevos datos
   */
  private updateCharts(): void {
    if (!this.report) return;

    this.updateIntervalChart();
    this.updateCustomerChart();
  }

  /**
   * Actualiza gráfico de intervalos de distancia
   */
  private updateIntervalChart(): void {
    if (!this.report?.globalIntervalCounts) return;

    const labels = Object.keys(this.report.globalIntervalCounts);
    const data = Object.values(this.report.globalIntervalCounts);
    const colors = labels.map(label => DistanceIntervalColors[label] || '#999');

    this.intervalChartData = {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderColor: colors.map(color => this.lightenColor(color, 20)),
        borderWidth: 2,
        hoverBackgroundColor: colors.map(color => this.lightenColor(color, 10)),
        hoverBorderColor: colors.map(color => this.darkenColor(color, 10)),
        hoverBorderWidth: 3
      }]
    };

    // Forzar actualización del gráfico
    /*if (this.intervalChart) {
      this.intervalChart.update();
    }*/
  }

  /**
   * Actualiza gráfico de órdenes por cliente
   */
  private updateCustomerChart(): void {
    if (!this.report?.customerReports) return;

    const topCustomers = this.report.customerReports
      .sort((a, b) => b.totalOrders - a.totalOrders)
      .slice(0, 10);

    const labels = topCustomers.map(c => c.customerName);
    const data = topCustomers.map(c => c.totalOrders);

    this.customerChartData = {
      labels,
      datasets: [{
        label: 'Órdenes',
        data,
        backgroundColor: '#2196F3',
        borderColor: '#1976D2',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
        hoverBackgroundColor: '#1976D2',
        hoverBorderColor: '#1565C0',
        hoverBorderWidth: 3
      }]
    };

    // Forzar actualización del gráfico
    /*if (this.customerChart) {
      this.customerChart.update();
    }*/
  }

  /**
   * Limpia filtros
   */
  clearFilters(): void {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    this.filtersForm.patchValue({
      customerId: '',
      startDate: firstDayOfMonth,
      endDate: now
    });
  }

  /**
   * Exporta reporte a Excel
   */
  exportToExcel(): void {
    if (!this.report) {
      this.notificationService.warning('No hay datos para exportar');
      return;
    }

    this.isExporting = true;
    
    const formValue = this.filtersForm.value;
    const request: ReportRequest = {
      customerId: formValue.customerId || undefined,
      startDate: formValue.startDate ? DateUtil.toInputFormat(formValue.startDate) : undefined,
      endDate: formValue.endDate ? DateUtil.toInputFormat(formValue.endDate) : undefined,
      exportFormat: 'excel'
    };

    this.reportService.exportOrdersReportExcel(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          debugger;
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `reporte-ordenes-${DateUtil.getCurrentISODate().split('T')[0]}.xlsx`;
          link.click();
          window.URL.revokeObjectURL(url);
          
          this.notificationService.success('Reporte exportado exitosamente');
          this.isExporting = false;
        },
        error: (error) => {
          this.notificationService.error('Error al exportar el reporte');
          console.error('Error exporting report:', error);
          this.isExporting = false;
        }
      });
  }

  /**
   * Exporta reporte a CSV
   */
  exportToCsv(): void {
    if (!this.report) {
      this.notificationService.warning('No hay datos para exportar');
      return;
    }

    this.isExporting = true;
    
    const formValue = this.filtersForm.value;
    const request: ReportRequest = {
      customerId: formValue.customerId || undefined,
      startDate: formValue.startDate ? DateUtil.toInputFormat(formValue.startDate) : undefined,
      endDate: formValue.endDate ? DateUtil.toInputFormat(formValue.endDate) : undefined,
      exportFormat: 'csv'
    };

    this.reportService.exportOrdersReportCsv(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `reporte-ordenes-${DateUtil.getCurrentISODate().split('T')[0]}.csv`;
          link.click();
          window.URL.revokeObjectURL(url);
          
          this.notificationService.success('Reporte exportado exitosamente');
          this.isExporting = false;
        },
        error: (error) => {
          this.notificationService.error('Error al exportar el reporte');
          console.error('Error exporting report:', error);
          this.isExporting = false;
        }
      });
  }

  /**
   * Refresca todos los datos
   */
  refreshData(): void {
    this.loadReport();
    this.loadMetrics();
  }

  /**
   * Obtiene el nombre del cliente seleccionado
   */
  getSelectedCustomerName(): string {
    const customerId = this.filtersForm.get('customerId')?.value;
    if (!customerId) return 'Todos los clientes';
    
    const customer = this.customers.find(c => c.id === customerId);
    return customer?.name || 'Cliente desconocido';
  }

  /**
   * Formatea número con separadores
   */
  formatNumber(value: number): string {
    return new Intl.NumberFormat('es-PE').format(value);
  }

  /**
   * Formatea moneda
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  }

  /**
   * Aclara un color hexadecimal
   */
  private lightenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + 
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + 
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  /**
   * Oscurece un color hexadecimal
   */
  private darkenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    
    return '#' + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 + 
      (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 + 
      (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
  }

  /**
   * Track by para ngFor
   */
  trackByIndex(index: number): number {
    return index;
  }
}
