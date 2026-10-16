import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface PagoDTO {
  id: number;
  reservaId: number;
  metodo: string;
  monto: number;
  fecha: string;
}

@Injectable({ providedIn: 'root' })
export class PagoService {
  private URL = 'http://localhost:8090/api';
  private http = inject(HttpClient);

  registrar(pago: { reservaId: number; metodo: string; monto: number }): Observable<PagoDTO> {
    return this.http.post<PagoDTO>(`${this.URL}/pago/registrar`, pago);
  }

  buscarPorReserva(reservaId: number): Observable<PagoDTO> {
    return this.http.get<PagoDTO>(`${this.URL}/pago/buscarPorReserva/${reservaId}`);
  }
  totalIngresosPorSede(sedeId: number): Observable<number> {
    return this.http.get<number>(`${this.URL}/pago/totalIngresosPorSede/${sedeId}`);
  }

  ingresosPorMetodoEnSede(sedeId: number): Observable<{ [key: string]: number }> {
    return this.http.get<{ [key: string]: number }>(`${this.URL}/pago/ingresosPorMetodoEnSede/${sedeId}`);
  }
}