export interface Vehiculo {
  id: number;
  placa: string;
  tipo: 'AUTO' | 'MOTO';
  modelo: string;
  usuarioId: number;
}
