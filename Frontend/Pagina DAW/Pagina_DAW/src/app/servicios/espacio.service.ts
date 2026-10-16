import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Espacio } from '../modelos/espacio';

@Injectable({ providedIn: 'root' })
export class EspacioService {
  private URL = 'http://localhost:8090/api';
  private http = inject(HttpClient);

  listarPorSede(sedeId: number): Observable<Espacio[]> {
    return this.http.get<Espacio[]>(`${this.URL}/espacio/listarPorSede/${sedeId}`);
  }

  listarDisponiblesPorSede(sedeId: number): Observable<Espacio[]> {
    return this.http.get<Espacio[]>(`${this.URL}/espacio/listarDisponiblesPorSede/${sedeId}`);
  }

  listarPorTipo(sedeId: number, tipo: string): Observable<Espacio[]> {
    return this.http.get<Espacio[]>(`${this.URL}/espacio/listarDisponiblesPorSedeYTipo?sedeId=${sedeId}&tipo=${tipo}`);
  }
  buscarPorId(id: number): Observable<Espacio> {
  return this.http.get<Espacio>(`${this.URL}/espacio/buscar/${id}`);
}

resumenOcupacion(sedeId: number): Observable<{ [key: string]: number }> {
  return this.http.get<{ [key: string]: number }>(
    `${this.URL}/espacio/resumenOcupacion/${sedeId}`
  );
}
}