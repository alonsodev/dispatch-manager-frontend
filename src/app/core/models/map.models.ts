import { Coordinate } from "./order.models";

export interface MapConfig {
  center: Coordinate;
  zoom: number;
  maxZoom: number;
  minZoom: number;
}

export interface MapMarker {
  id: string;
  coordinate: Coordinate;
  type: 'origin' | 'destination';
  title: string;
  description?: string;
  color?: string;
}

export interface MapRoute {
  origin: Coordinate;
  destination: Coordinate;
  distance: number;
  cost: number;
  color?: string;
}

export const DEFAULT_MAP_CONFIG: MapConfig = {
  center: { latitude: -12.046374, longitude: -77.042793 }, // Lima, Perú
  zoom: 10,
  maxZoom: 18,
  minZoom: 5
};