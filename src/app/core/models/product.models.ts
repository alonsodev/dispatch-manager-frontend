export interface Product {
  id: string;
  name: string;
  description: string;
  unitPrice: number;
  unit: string;
  createdAt: string;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  unitPrice: number;
  unit: string;
}

export interface ProductListItem {
  id: string;
  name: string;
  unitPrice: number;
  unit: string;
}

export interface UpdateProductRequest {
  id: string;
  name: string;
  description: string;
  unitPrice: number;
  unit: string;
}