export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface FormValidationState {
  isValid: boolean;
  errors: ValidationError[];
  touched: Record<string, boolean>;
}

export interface CoordinateValidation {
  latitude: {
    min: number;
    max: number;
  };
  longitude: {
    min: number;
    max: number;
  };
}

export const PERU_COORDINATE_BOUNDS: CoordinateValidation = {
  latitude: { min: -18.35, max: -0.04 },
  longitude: { min: -81.33, max: -68.65 }
};

export const DISTANCE_LIMITS = {
  min: 1,
  max: 1000
} as const;

export const QUANTITY_LIMITS = {
  min: 1,
  max: 10000
} as const;