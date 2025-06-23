import { Coordinate } from '@core/models';
import { 
    PERU_COORDINATE_BOUNDS
} from '@core/models/validation.models';

/**
 * Utilidades para manejo de coordenadas
 */
export class CoordinatesUtil {
  
  /**
   * Valida formato de coordenada
   */
  static isValidCoordinate(coordinate: Coordinate): boolean {
    const { latitude, longitude } = coordinate;
    
    return (
      typeof latitude === 'number' &&
      typeof longitude === 'number' &&
      !isNaN(latitude) &&
      !isNaN(longitude) &&
      latitude >= -90 && latitude <= 90 &&
      longitude >= -180 && longitude <= 180
    );
  }

  /**
   * Valida si está en Perú
   */
  static isInPeru(coordinate: Coordinate): boolean {
    return (
      coordinate.latitude >= PERU_COORDINATE_BOUNDS.latitude.min &&
      coordinate.latitude <= PERU_COORDINATE_BOUNDS.latitude.max &&
      coordinate.longitude >= PERU_COORDINATE_BOUNDS.longitude.min &&
      coordinate.longitude <= PERU_COORDINATE_BOUNDS.longitude.max
    );
  }

  /**
   * Formatea coordenada para mostrar
   */
  static formatCoordinate(coordinate: Coordinate, decimals = 6): string {
    if(typeof(coordinate.latitude) == "string" || typeof(coordinate.longitude) == "string") return "";

    return `${coordinate.latitude.toFixed(decimals)}, ${coordinate.longitude.toFixed(decimals)}`;
  }

  /**
   * Parsea string de coordenada
   */
  static parseCoordinate(coordinateString: string): Coordinate | null {
    try {
      const parts = coordinateString.split(',').map(part => parseFloat(part.trim()));
      
      if (parts.length !== 2 || parts.some(isNaN)) {
        return null;
      }

      const coordinate: Coordinate = {
        latitude: parts[0],
        longitude: parts[1]
      };

      return this.isValidCoordinate(coordinate) ? coordinate : null;
    } catch {
      return null;
    }
  }

  /**
   * Calcula punto medio entre dos coordenadas
   */
  static getMidpoint(coord1: Coordinate, coord2: Coordinate): Coordinate {
    return {
      latitude: (coord1.latitude + coord2.latitude) / 2,
      longitude: (coord1.longitude + coord2.longitude) / 2
    };
  }

  /**
   * Genera coordenada aleatoria dentro de Perú
   */
  static generateRandomPeruCoordinate(): Coordinate {
    const { latitude: latBounds, longitude: lngBounds } = PERU_COORDINATE_BOUNDS;
    
    return {
      latitude: Math.random() * (latBounds.max - latBounds.min) + latBounds.min,
      longitude: Math.random() * (lngBounds.max - lngBounds.min) + lngBounds.min
    };
  }
}