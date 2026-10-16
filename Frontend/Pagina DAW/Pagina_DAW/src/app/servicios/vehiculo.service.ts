import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Vehiculo } from '../modelos/vehiculo';

@Injectable({ providedIn: 'root' })
export class VehiculoService {
  private URL = 'http://localhost:8090/api';
  private http = inject(HttpClient);

  listarPorUsuario(usuarioId: number): Observable<Vehiculo[]> {
    return this.http.get<Vehiculo[]>(`${this.URL}/vehiculo/listarPorUsuario/${usuarioId}`);
  }

  registrar(vehiculo: Vehiculo): Observable<Vehiculo> {
    return this.http.post<Vehiculo>(`${this.URL}/vehiculo/registrar`, vehiculo);
  }

  actualizar(id: number, vehiculo: Vehiculo): Observable<Vehiculo> {
    return this.http.put<Vehiculo>(`${this.URL}/vehiculo/actualizar/${id}`, vehiculo);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.URL}/vehiculo/eliminar/${id}`);
  }
  buscarPorId(id: number): Observable<Vehiculo> {
  return this.http.get<Vehiculo>(`${this.URL}/vehiculo/buscar/${id}`);
}
}