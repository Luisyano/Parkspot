import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Usuario } from '../modelos/usuario';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private URL = 'http://localhost:8090/api';
  private http = inject(HttpClient);

  registrar(usuario: Usuario): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.URL}/usuario/registrar`, usuario);
  }

  buscarPorEmail(email: string): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.URL}/usuario/buscarPorEmail/${email}`);
  }

  buscarPorId(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.URL}/usuario/buscar/${id}`);
  }

  actualizar(id: number, usuario: Usuario): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.URL}/usuario/actualizar/${id}`, usuario);
  }

  listarTodos(): Observable<Usuario[]> {
  return this.http.get<Usuario[]>(`${this.URL}/usuario/listar`);
}

  // ✅ NUEVOS MÉTODOS
  listarPorRol(rol: string): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.URL}/usuario/listarPorRol/${rol}`);
  }

  listarOperadoresPorSede(sedeId: number): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.URL}/usuario/listarOperadoresPorSede/${sedeId}`);
  }
}