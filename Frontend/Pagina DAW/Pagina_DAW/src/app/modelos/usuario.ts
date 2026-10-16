export interface Usuario {
  id: number;
  nombres: string;
  apellidos: string;
  email: string;
  password?: string;
  celular: string;
  rol: 'CLIENTE' | 'OPERADOR' | 'ADMIN';
  sedeId?: number;
  conadisVerificado: boolean;
  conadisImagenUrl?: string;
  conadisFechaExpiracion?: string;
  tieneTarjetaGuardada: boolean;
}