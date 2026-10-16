import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Plan } from '../modelos/plan';

@Injectable({ providedIn: 'root' })
export class PlanService {   // ← ¡TIENE QUE SER PlanService!
  private URL = 'http://localhost:8090/api';
  private http = inject(HttpClient);

  listar(): Observable<Plan[]> {
    return this.http.get<Plan[]>(`${this.URL}/plan/listar`);
  }

  buscarPorId(id: number): Observable<Plan> {
    return this.http.get<Plan>(`${this.URL}/plan/buscar/${id}`);
  }
}