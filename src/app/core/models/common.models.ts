export interface BaseResponse<T = any> {
  success: boolean;
  message: string;
  errors: string[];
  data?: T;
}

export interface PagedResponse<T = any> extends BaseResponse<T[]> {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface ApiError {
  statusCode: number;
  message: string;
  details?: string[];
}

export interface PaginationParams {
  pageNumber: number;
  pageSize: number;
}

export interface SearchParams extends PaginationParams {
  searchTerm?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}