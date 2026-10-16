export interface Reserva {
  id: number;
  usuarioId: number;
  espacioId: number;
  planId: number;
  vehiculoId: number;
  fechaInicio: string;
  fechaFin: string;
  estado: 'PENDIENTE' | 'CONFIRMADA' | 'ACTIVA' | 'FINALIZADA' | 'CANCELADA' | 'EXCEDIDA';
  fechaCreacion: string;
  nombreUsuario?: string;
  codigoEspacio?: string;
  nombrePlan?: string;
  placaVehiculo?: string;
  ticketId?: number;
  pagoId?: number;
}

export type NuevaReserva = Omit<Reserva, 'id' | 'estado' | 'fechaCreacion'>;