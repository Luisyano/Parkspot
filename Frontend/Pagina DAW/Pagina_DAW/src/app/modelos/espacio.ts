export interface Espacio {
  id: number;
  pisoId: number;
  sedeId: number;
  codigo: string;      // ej. 'A-01'
  tipo: 'REGULAR' | 'DISCAPACITADO' | 'MOTO';
  estado: 'DISPONIBLE' | 'RESERVADO' | 'OCUPADO' | 'MANTENIMIENTO';
}
