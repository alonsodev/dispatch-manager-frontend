import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import * as L from 'leaflet';
import { ApiService } from './api.service';
import { 
    PERU_COORDINATE_BOUNDS
} from '@core/models/validation.models';
import {DEFAULT_MAP_CONFIG, MapConfig} from '@core/models/map.models'
import { 
  Coordinate
} from '@core/models';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private readonly selectedCoordinatesSubject = new BehaviorSubject<{
    origin?: Coordinate;
    destination?: Coordinate;
  }>({});

  readonly selectedCoordinates$ = this.selectedCoordinatesSubject.asObservable();

  /**
   * Calcula distancia usando fórmula de Haversine
   * Esta es la misma lógica que usa el backend
   */
  calculateHaversineDistance(coord1: Coordinate, coord2: Coordinate): number {
    const R = 6371; // Radio de la Tierra en kilómetros
    const dLat = this.toRadians(coord2.latitude - coord1.latitude);
    const dLng = this.toRadians(coord2.longitude - coord1.longitude);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.latitude)) * 
      Math.cos(this.toRadians(coord2.latitude)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // Redondear a 2 decimales
  }

  /**
   * Calcula costo basado en distancia (misma lógica del backend)
   */
  calculateCostFromDistance(distanceKm: number): number {
    if (distanceKm >= 1 && distanceKm <= 50) return 100;
    if (distanceKm >= 51 && distanceKm <= 200) return 300;
    if (distanceKm >= 201 && distanceKm <= 500) return 1000;
    if (distanceKm >= 501 && distanceKm <= 1000) return 1500;
    
    throw new Error('Distancia fuera del rango permitido (1-1000 km)');
  }

  /**
   * Obtiene intervalo de distancia
   */
  getDistanceInterval(distanceKm: number): string {
    if (distanceKm >= 1 && distanceKm <= 50) return '1-50 km';
    if (distanceKm >= 51 && distanceKm <= 200) return '51-200 km';
    if (distanceKm >= 201 && distanceKm <= 500) return '201-500 km';
    if (distanceKm >= 501 && distanceKm <= 1000) return '501-1000 km';
    
    throw new Error('Distancia fuera del rango permitido');
  }

  /**
   * Valida si una coordenada está dentro de los límites de Perú
   */
  isCoordinateInPeru(coordinate: Coordinate): boolean {
    return (
      coordinate.latitude >= PERU_COORDINATE_BOUNDS.latitude.min &&
      coordinate.latitude <= PERU_COORDINATE_BOUNDS.latitude.max &&
      coordinate.longitude >= PERU_COORDINATE_BOUNDS.longitude.min &&
      coordinate.longitude <= PERU_COORDINATE_BOUNDS.longitude.max
    );
  }

  /**
   * Valida distancia entre coordenadas
   */
  validateDistance(origin: Coordinate, destination: Coordinate): {
    isValid: boolean;
    distance?: number;
    error?: string;
  } {
    try {
      const distance = this.calculateHaversineDistance(origin, destination);
      
      if (distance < 1) {
        return {
          isValid: false,
          distance,
          error: 'La distancia mínima permitida es 1 km'
        };
      }
      
      if (distance > 1000) {
        return {
          isValid: false,
          distance,
          error: 'La distancia máxima permitida es 1000 km'
        };
      }
      
      return {
        isValid: true,
        distance
      };
      
    } catch (error) {
      return {
        isValid: false,
        error: 'Error al calcular la distancia'
      };
    }
  }

  /**
   * Crea configuración de mapa personalizada
   */
  createMapConfig(center?: Coordinate, zoom?: number): MapConfig {
    return {
      ...DEFAULT_MAP_CONFIG,
      ...(center && { center }),
      ...(zoom && { zoom })
    };
  }

  /**
   * Crea ícono de marcador personalizado
   */
  createMarkerIcon(type: 'origin' | 'destination'): L.Icon {
    const iconUrl = type === 'origin' 
      ? 'assets/icons/marker-origin.png' 
      : 'assets/icons/marker-destination.png';
    
    return L.icon({
      iconUrl,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
      shadowUrl: 'assets/icons/marker-shadow.png',
      shadowSize: [41, 41],
      shadowAnchor: [13, 41]
    });
  }

  /**
   * Crea marcador con configuración estándar
   */
  createMarker(coordinate: Coordinate, options: {
    type: 'origin' | 'destination';
    title: string;
    description?: string;
  }): L.Marker {
    const marker = L.marker([coordinate.latitude, coordinate.longitude], {
      icon: this.createMarkerIcon(options.type),
      title: options.title,
      draggable: true
    });

    if (options.description) {
      marker.bindPopup(`
        <div class="marker-popup">
          <h4>${options.title}</h4>
          <p>${options.description}</p>
          <small>
            <strong>Lat:</strong> ${coordinate.latitude.toFixed(6)}<br>
            <strong>Lng:</strong> ${coordinate.longitude.toFixed(6)}
          </small>
        </div>
      `);
    }

    return marker;
  }

  /**
   * Actualiza coordenadas seleccionadas
   */
  setOriginCoordinate(coordinate: Coordinate): void {
    const current = this.selectedCoordinatesSubject.value;
    this.selectedCoordinatesSubject.next({
      ...current,
      origin: coordinate
    });
  }

  /**
   * Actualiza coordenada de destino
   */
  setDestinationCoordinate(coordinate: Coordinate): void {
    const current = this.selectedCoordinatesSubject.value;
    this.selectedCoordinatesSubject.next({
      ...current,
      destination: coordinate
    });
  }

  /**
   * Limpia coordenadas seleccionadas
   */
  clearSelectedCoordinates(): void {
    this.selectedCoordinatesSubject.next({});
  }

  /**
   * Obtiene coordenadas de ciudades principales de Perú
   */
  getPeruMainCities(): { name: string; coordinate: Coordinate }[] {
    return [
      { name: 'Lima', coordinate: { latitude: -12.046374, longitude: -77.042793 } },
      { name: 'Arequipa', coordinate: { latitude: -16.409047, longitude: -71.537451 } },
      { name: 'Trujillo', coordinate: { latitude: -8.1116, longitude: -79.0288 } },
      { name: 'Chiclayo', coordinate: { latitude: -6.7714, longitude: -79.8370 } },
      { name: 'Piura', coordinate: { latitude: -5.1945, longitude: -80.6328 } },
      { name: 'Iquitos', coordinate: { latitude: -3.7437, longitude: -73.2516 } },
      { name: 'Cusco', coordinate: { latitude: -13.5319, longitude: -71.9675 } },
      { name: 'Huancayo', coordinate: { latitude: -12.0653, longitude: -75.2049 } },
      { name: 'Tacna', coordinate: { latitude: -18.0131, longitude: -70.2536 } },
      { name: 'Callao', coordinate: { latitude: -12.0667, longitude: -77.1167 } }
    ];
  }

  /**
   * Convierte grados a radianes
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
