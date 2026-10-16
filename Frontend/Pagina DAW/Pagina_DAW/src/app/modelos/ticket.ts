export interface Ticket {
  id: number;
  reservaId: number;
  codigo: string;          // Ej: PS-2026-10-01-XXXXX
  qrCode: string;          // Ej: QR_PS-2026-10-01-XXXXX
  montoPagado: number;
  fechaIngresoReal: string | null;
  fechaSalidaReal: string | null;
  operadorIngresoId: number | null;
  operadorSalidaId: number | null;
  cobroAdicional: number;

  // Datos anidados
  nombreUsuario?: string;
  codigoEspacio?: string;
  placaVehiculo?: string;
}