export interface Plan {
  id: number;
  nombre: 'POR_HORA' | 'MENSUAL' | 'ANUAL';
  precioBase: number;
  descuentoPorcentaje: number;
  precioFinal: number;  // Calculado con descuento
}