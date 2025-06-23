export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

export interface CreateCustomerRequest {
  name: string;
  email: string;
  phone: string;
}

export interface CustomerListItem {
  id: string;
  name: string;
  email: string;
}

export interface UpdateCustomerRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
}
