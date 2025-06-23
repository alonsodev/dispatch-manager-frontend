export interface OrdersReport {
  customerReports: CustomerOrdersReport[];
  globalIntervalCounts: Record<string, number>;
  totalOrders: number;
  generatedAt: string;
}

export interface CustomerOrdersReport {
  customerId: string;
  customerName: string;
  intervalCounts: Record<string, number>;
  totalOrders: number;
}

export interface ReportRequest {
  customerId?: string;
  startDate?: string;
  endDate?: string;
  distanceInterval?: string;
  includeGlobalSummary?: boolean;
  exportFormat?: 'excel' | 'csv';
}

export interface ReportMetrics {
  totalOrders: number;
  totalRevenue: number;
  averageDistance: number;
  mostActiveCustomer: string;
  popularDistanceInterval: string;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}