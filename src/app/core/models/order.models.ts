import { SearchParams } from "./common.models";
import { OrderStatus } from "./enums";

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  productId: string;
  productName: string;
  quantity: number;
  origin: Coordinate;
  destination: Coordinate;
  distanceKm: number;
  distanceInterval: string;
  costAmount: number;
  costCurrency: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateOrderRequest {
  customerId: string;
  productId: string;
  quantity: number;
  origin: Coordinate;
  destination: Coordinate;
}

export interface OrderListItem {
  id: string;
  customerName: string;
  productName: string;
  quantity: number;
  distanceKm: number;
  costAmount: number;
  status: OrderStatus;
  createdAt: string;
}

export interface UpdateOrderStatusRequest {
  orderId: string;
  newStatus: OrderStatus;
}

export interface OrdersSearchParams extends SearchParams {
  customerId?: string;
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
  minDistance?: number;
  maxDistance?: number;
}