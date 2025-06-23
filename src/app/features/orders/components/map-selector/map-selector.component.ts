import { 
  Component, 
  OnInit, 
  OnDestroy, 
  Input,        
  Output, 
  EventEmitter, 
  ViewChild, 
  ElementRef,
  AfterViewInit,
  OnChanges,    
  SimpleChanges, 
  inject,
  ViewEncapsulation 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

// Leaflet
import * as L from 'leaflet';

// Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

// Services y Models
import { MapService } from '@core/services';
import { Coordinate, DEFAULT_MAP_CONFIG } from '@core/models';

@Component({
  selector: 'app-map-selector',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './map-selector.component.html',
  styleUrls: ['./map-selector.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MapSelectorComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {
  private readonly mapService = inject(MapService);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;

  // ✅ INPUTS AGREGADOS - Recibir coordenadas del formulario
  @Input() origin: Coordinate | null = null;
  @Input() destination: Coordinate | null = null;

  // OUTPUTS - Emitir coordenadas seleccionadas
  @Output() originSelected = new EventEmitter<Coordinate>();
  @Output() destinationSelected = new EventEmitter<Coordinate>();

  private map!: L.Map;
  private originMarker?: L.Marker;
  private destinationMarker?: L.Marker;
  private routeLine?: L.Polyline;
  private currentMode: 'origin' | 'destination' = 'origin';

  ngOnInit(): void {
    this.setupMapSubscriptions();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeMap();
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.map) {
      this.map.remove();
    }
  }

  // ✅ NUEVO - Detectar cambios en las coordenadas de entrada
  ngOnChanges(changes: SimpleChanges): void {
    if (this.map) {
      // Actualizar marcadores cuando cambien las coordenadas de entrada
      if (changes['origin'] && this.origin) {
        this.updateOriginMarker(this.origin);
      }
      
      if (changes['destination'] && this.destination) {
        this.updateDestinationMarker(this.destination);
      }

      // Dibujar ruta si ambas coordenadas están disponibles
      if (this.origin && this.destination) {
        this.drawRoute(this.origin, this.destination);
      } else {
        this.clearRoute();
      }
    }
  }

  /**
   * Inicializa el mapa Leaflet
   */
  private initializeMap(): void {
    try {
      const container = this.mapContainer.nativeElement;
      
      // Configuración básica del mapa centrado en Lima, Perú
      this.map = L.map(container).setView(
        [DEFAULT_MAP_CONFIG.center.latitude, DEFAULT_MAP_CONFIG.center.longitude], 
        DEFAULT_MAP_CONFIG.zoom
      );

      // Agregar capa de tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);

      // Configurar eventos del mapa
      this.map.on('click', (e: L.LeafletMouseEvent) => {
        this.onMapClick(e.latlng);
      });

      // ✅ Mostrar marcadores existentes si hay coordenadas de entrada
      if (this.origin) {
        this.updateOriginMarker(this.origin);
      }
      
      if (this.destination) {
        this.updateDestinationMarker(this.destination);
      }

      // ✅ Dibujar ruta si ambas coordenadas están disponibles
      if (this.origin && this.destination) {
        this.drawRoute(this.origin, this.destination);
      }

      console.log('Map initialized successfully');
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }

  /**
   * Configura subscripciones del servicio de mapa
   */
  private setupMapSubscriptions(): void {
    this.mapService.selectedCoordinates$
      .pipe(takeUntil(this.destroy$))
      .subscribe(coordinates => {
        if (coordinates.origin) {
          this.updateOriginMarker(coordinates.origin);
        }
        
        if (coordinates.destination) {
          this.updateDestinationMarker(coordinates.destination);
        }

        // Dibujar ruta si ambas coordenadas están disponibles
        if (coordinates.origin && coordinates.destination) {
          this.drawRoute(coordinates.origin, coordinates.destination);
        } else {
          this.clearRoute();
        }
      });
  }

  /**
   * Maneja clic en el mapa
   */
  private onMapClick(latlng: L.LatLng): void {
    const coordinate: Coordinate = {
      latitude: latlng.lat,
      longitude: latlng.lng
    };

    if (this.currentMode === 'origin') {
      this.originSelected.emit(coordinate);
      this.currentMode = 'destination'; // Cambiar automáticamente al destino
    } else {
      this.destinationSelected.emit(coordinate);
      this.currentMode = 'origin'; // Volver al origen para el siguiente clic
    }
  }

  /**
   * Actualiza marcador de origen
   */
  private updateOriginMarker(coordinate: Coordinate): void {
    if (this.originMarker) {
      this.map.removeLayer(this.originMarker);
    }

    // Crear icono personalizado para origen
    const icon = L.divIcon({
      html: `<div class="custom-marker origin-marker">
               <mat-icon>radio_button_checked</mat-icon>
             </div>`,
      className: 'custom-map-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    });

    this.originMarker = L.marker([coordinate.latitude, coordinate.longitude], { icon })
      .addTo(this.map)
      .bindPopup(`
        <div class="marker-popup">
          <h4><mat-icon>radio_button_checked</mat-icon> Origen</h4>
          <p><strong>Lat:</strong> ${typeof(coordinate.latitude) == "string" ? "" : coordinate.latitude.toFixed(6)}</p>
          <p><strong>Lng:</strong> ${typeof(coordinate.longitude) == "string" ? "" : coordinate.longitude.toFixed(6)}</p>
        </div>
      `);
  }

  /**
   * Actualiza marcador de destino
   */
  private updateDestinationMarker(coordinate: Coordinate): void {
    if (this.destinationMarker) {
      this.map.removeLayer(this.destinationMarker);
    }

    // Crear icono personalizado para destino
    const icon = L.divIcon({
      html: `<div class="custom-marker destination-marker">
               <mat-icon>location_on</mat-icon>
             </div>`,
      className: 'custom-map-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    });

    this.destinationMarker = L.marker([coordinate.latitude, coordinate.longitude], { icon })
      .addTo(this.map)
      .bindPopup(`
        <div class="marker-popup">
          <h4><mat-icon>location_on</mat-icon> Destino</h4>
          <p><strong>Lat:</strong> ${typeof(coordinate.latitude) == "string" ? "" : coordinate.latitude.toFixed(6)}</p>
          <p><strong>Lng:</strong> ${typeof(coordinate.longitude) == "string" ? "" : coordinate.longitude.toFixed(6)}</p>
        </div>
      `);
  }

  /**
   * Dibuja ruta entre origen y destino
   */
  private drawRoute(origin: Coordinate, destination: Coordinate): void {
    this.clearRoute();

    const latlngs: L.LatLng[] = [
      L.latLng(origin.latitude, origin.longitude),
      L.latLng(destination.latitude, destination.longitude)
    ];

    this.routeLine = L.polyline(latlngs, {
      color: '#2196F3',
      weight: 4,
      opacity: 0.8,
      dashArray: '10, 10'
    }).addTo(this.map);

    // Ajustar vista para mostrar ambos puntos
    if (this.originMarker && this.destinationMarker) {
      const group = new L.FeatureGroup([this.originMarker, this.destinationMarker]);
      this.map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  /**
   * Limpia la ruta dibujada
   */
  private clearRoute(): void {
    if (this.routeLine) {
      this.map.removeLayer(this.routeLine);
      this.routeLine = undefined;
    }
  }

  /**
   * Centra el mapa en Lima
   */
  centerMap(): void {
    if (this.map) {
      this.map.setView(
        [DEFAULT_MAP_CONFIG.center.latitude, DEFAULT_MAP_CONFIG.center.longitude], 
        DEFAULT_MAP_CONFIG.zoom
      );
    }
  }

  /**
   * Limpia todos los marcadores
   */
  clearMarkers(): void {
    if (this.originMarker) {
      this.map.removeLayer(this.originMarker);
      this.originMarker = undefined;
    }
    
    if (this.destinationMarker) {
      this.map.removeLayer(this.destinationMarker);
      this.destinationMarker = undefined;
    }
    
    this.clearRoute();
    this.currentMode = 'origin';
    
    // Limpiar coordenadas en el servicio
    this.mapService.clearSelectedCoordinates();
  }

  /**
   * Obtiene el texto del modo actual
   */
  getCurrentModeText(): string {
    return this.currentMode === 'origin' 
      ? 'Haz clic para seleccionar ORIGEN' 
      : 'Haz clic para seleccionar DESTINO';
  }

  /**
   * Cambia el modo de selección
   */
  setMode(mode: 'origin' | 'destination'): void {
    this.currentMode = mode;
  }

  /**
   * ✅ NUEVOS MÉTODOS - Para recibir coordenadas desde eventos externos
   */
  
  /**
   * Establece coordenadas de origen desde evento externo
   */
  setOriginCoordinate(coordinate: Coordinate): void {
    this.updateOriginMarker(coordinate);
    if (this.destination) {
      this.drawRoute(coordinate, this.destination);
    }
  }

  /**
   * Establece coordenadas de destino desde evento externo
   */
  setDestinationCoordinate(coordinate: Coordinate): void {
    this.updateDestinationMarker(coordinate);
    if (this.origin) {
      this.drawRoute(this.origin, coordinate);
    }
  }
}