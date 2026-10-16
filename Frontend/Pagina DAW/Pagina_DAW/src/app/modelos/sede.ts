export interface Sede {
  id: number;
  nombre: string;
  direccion: string;
  distrito: string;
  horaApertura: string;
  horaCierre: string;
  estado: 'ACTIVA' | 'PAUSADA' | 'INACTIVA';
}