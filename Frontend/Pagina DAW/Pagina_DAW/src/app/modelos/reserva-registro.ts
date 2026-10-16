// src/app/modelos/reserva-registro.ts
export interface ReservaRegistro {
  usuarioId: number;
  espacioId: number;
  planId: number;
  vehiculoId: number;
  fechaInicio: string;
  fechaFin: string;
}