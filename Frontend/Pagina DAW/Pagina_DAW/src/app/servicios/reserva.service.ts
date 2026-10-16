import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Reserva } from '../modelos/reserva';
import { ReservaRegistro } from '../modelos/reserva-registro';

@Injectable({ providedIn: 'root' })
export class ReservaService {
  private URL = 'http://localhost:8090/api';
  private http = inject(HttpClient);

  listarTodos(): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(`${this.URL}/reserva/listar`);
  }

  listarPorUsuario(usuarioId: number): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(`${this.URL}/reserva/listarPorUsuario/${usuarioId}`);
  }

  listarActivasPorUsuario(usuarioId: number): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(`${this.URL}/reserva/listarActivasPorUsuario/${usuarioId}`);
  }

  // ✅ MÉTODO QUE FALTABA
  listarPorEspacio(espacioId: number): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(`${this.URL}/reserva/listarPorEspacio/${espacioId}`);
  }

  buscarPorId(id: number): Observable<Reserva> {
    return this.http.get<Reserva>(`${this.URL}/reserva/buscar/${id}`);
  }

  registrar(reserva: ReservaRegistro): Observable<Reserva> {
    return this.http.post<Reserva>(`${this.URL}/reserva/registrar`, reserva);
  }

  cancelar(id: number): Observable<Reserva> {
    return this.http.patch<Reserva>(`${this.URL}/reserva/cancelar/${id}`, {});
  }

  confirmar(id: number, monto: number): Observable<Reserva> {
    return this.http.patch<Reserva>(
      `${this.URL}/reserva/confirmar/${id}?montoPagado=${monto}`,
      {}
    );
  }
}