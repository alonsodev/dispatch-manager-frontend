export enum OrderStatus {
  Created = 0,
  InProgress = 1,
  Shipped = 2,
  Delivered = 3,
  Cancelled = 4
}

export const OrderStatusLabels: Record<OrderStatus, string> = {
  [OrderStatus.Created]: 'Creada',
  [OrderStatus.InProgress]: 'En Progreso',
  [OrderStatus.Shipped]: 'Enviada',
  [OrderStatus.Delivered]: 'Entregada',
  [OrderStatus.Cancelled]: 'Cancelada'
};

export enum DistanceInterval {
  Short = '1-50 km',
  Medium = '51-200 km',
  Long = '201-500 km',
  VeryLong = '501-1000 km'
}

export const DistanceIntervalColors: Record<string, string> = {
  '1-50 km': '#4CAF50',
  '51-200 km': '#FF9800',
  '201-500 km': '#2196F3',
  '501-1000 km': '#9C27B0'
};