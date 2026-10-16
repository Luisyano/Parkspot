import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Sede } from '../modelos/sede';

@Injectable({ providedIn: 'root' })
export class SedeService {
  private URL = 'http://localhost:8090/api';
  private http = inject(HttpClient);

  listar(): Observable<Sede[]> {
    return this.http.get<Sede[]>(`${this.URL}/sede/listar`);
  }

  listarPorDistrito(distrito: string): Observable<Sede[]> {
    return this.http.get<Sede[]>(`${this.URL}/sede/buscarPorDistrito/${distrito}`);
  }

  buscarPorId(id: number): Observable<Sede> {
    return this.http.get<Sede>(`${this.URL}/sede/buscar/${id}`);
  }
}