import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Ticket } from '../modelos/ticket';

@Injectable({ providedIn: 'root' })
export class TicketService {
  private URL = 'http://localhost:8090/api';
  private http = inject(HttpClient);

  buscarPorId(id: number): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.URL}/ticket/buscar/${id}`);
  }

  buscarPorCodigo(codigo: string): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.URL}/ticket/buscarPorCodigo/${codigo}`);
  }

  buscarPorReserva(reservaId: number): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.URL}/ticket/buscarPorReserva/${reservaId}`);
  }

  registrarIngreso(ticketId: number, operadorId: number): Observable<Ticket> {
    return this.http.patch<Ticket>(
      `${this.URL}/ticket/registrarIngreso/${ticketId}?operadorId=${operadorId}`,
      {}
    );
  }

  // ✅ NUEVO
  registrarSalida(ticketId: number): Observable<Ticket> {
    return this.http.patch<Ticket>(
      `${this.URL}/ticket/registrarSalida/${ticketId}`,
      {}
    );
  }
}