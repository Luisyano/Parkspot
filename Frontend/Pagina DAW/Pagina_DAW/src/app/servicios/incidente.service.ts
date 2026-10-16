import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface Incidente {
  id: number;
  espacioId?: number;
  ticketId?: number;
  operadorId: number;
  adminId?: number;
  tipo: 'ABANDONADO' | 'EXCESO_TIEMPO' | 'ESTACIONAMIENTO_INDEBIDO'
       | 'DANIO_PROPIEDAD' | 'SEGURIDAD' | 'USO_INDEBIDO_CONADIS';
  descripcion: string;
  solucion?: string;
  estado: 'ABIERTO' | 'EN_PROCESO' | 'RESUELTO' | 'CERRADO';
  fechaCreacion: string;
  fechaCierre?: string;
  nombreOperador?: string;
  nombreAdmin?: string;
  codigoEspacio?: string;
}

@Injectable({ providedIn: 'root' })
export class IncidenteService {
  private URL = 'http://localhost:8090/api';
  private http = inject(HttpClient);

  listar(): Observable<Incidente[]> {
    return this.http.get<Incidente[]>(`${this.URL}/incidente/listar`);
  }

  buscarPorId(id: number): Observable<Incidente> {
    return this.http.get<Incidente>(`${this.URL}/incidente/buscar/${id}`);
  }

  listarPorEstado(estado: string): Observable<Incidente[]> {
    return this.http.get<Incidente[]>(`${this.URL}/incidente/listarPorEstado/${estado}`);
  }

  listarPorTipo(tipo: string): Observable<Incidente[]> {
    return this.http.get<Incidente[]>(`${this.URL}/incidente/listarPorTipo/${tipo}`);
  }

  listarPorSede(sedeId: number): Observable<Incidente[]> {
    return this.http.get<Incidente[]>(`${this.URL}/incidente/listarPorSede/${sedeId}`);
  }

  listarAbiertosPorSede(sedeId: number): Observable<Incidente[]> {
    return this.http.get<Incidente[]>(`${this.URL}/incidente/listarAbiertosPorSede/${sedeId}`);
  }

  // ✅ MÉTODO QUE FALTABA
  listarUrgentesPorSede(sedeId: number): Observable<Incidente[]> {
    return this.http.get<Incidente[]>(`${this.URL}/incidente/listarUrgentesPorSede/${sedeId}`);
  }

  reportar(incidente: Incidente): Observable<Incidente> {
    return this.http.post<Incidente>(`${this.URL}/incidente/reportar`, incidente);
  }

  resolver(id: number, adminId: number, solucion: string): Observable<Incidente> {
    return this.http.patch<Incidente>(
      `${this.URL}/incidente/resolver/${id}?adminId=${adminId}&solucion=${encodeURIComponent(solucion)}`,
      {}
    );
  }

  cerrar(id: number): Observable<Incidente> {
    return this.http.patch<Incidente>(`${this.URL}/incidente/cerrar/${id}`, {});
  }

  reabrir(id: number): Observable<Incidente> {
    return this.http.patch<Incidente>(`${this.URL}/incidente/reabrir/${id}`, {});
  }
}