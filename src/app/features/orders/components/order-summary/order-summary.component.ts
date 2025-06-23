import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';

// Models
import { ProductListItem, Coordinate } from '@core/models';
import { CoordinatesUtil } from '@core/utils/coordinates.util';

@Component({
  selector: 'app-order-summary',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule
  ],
  templateUrl: './order-summary.component.html',
  styleUrls: ['./order-summary.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class OrderSummaryComponent {
  @Input() customerName: string = '';
  @Input() product: ProductListItem | null = null;
  @Input() quantity: number = 0;
  @Input() origin: Coordinate | null = null;
  @Input() destination: Coordinate | null = null;
  @Input() distance: number | null = null;
  @Input() distanceInterval: string | null = null;
  @Input() shippingCost: number | null = null;
  @Input() total: number = 0;

  /**
   * Calcula el total de productos
   */
  getProductTotal(): number {
    if (!this.product) return 0;
    return this.product.unitPrice * this.quantity;
  }

  /**
   * Formatea coordenadas para mostrar
   */
  formatCoordinate(coordinate: Coordinate | null): string {
    if (!coordinate) return 'No especificado';
    return CoordinatesUtil.formatCoordinate(coordinate, 4);
  }
}
