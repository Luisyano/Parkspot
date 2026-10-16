import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { UsuarioService } from '../../../servicios/usuario.service';
import { SedeService } from '../../../servicios/sede.service';
import { Usuario } from '../../../modelos/usuario';
import { Sede } from '../../../modelos/sede';

@Component({
  selector: 'app-operadores',
  imports: [CommonModule, FormsModule],
  templateUrl: './operadores.html',
  styleUrl: './operadores.css',
})
export class Operadores implements OnInit {

  private usuarioService = inject(UsuarioService);
  private sedeService = inject(SedeService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  // ==========================================
  // ESTADO
  // ==========================================
  cargando = true;
  errorMensaje = '';
  procesando = false;

  // ==========================================
  // DATOS
  // ==========================================
  operadores: Usuario[] = [];
  sedes: Sede[] = [];
  filtroSede: number | string = 'TODAS';
  filtroEstado: string = 'TODOS';

  // ==========================================
  // MODAL CREAR / EDITAR
  // ==========================================
  mostrarModal = false;
  modoEdicion = false;
  operadorForm: any = this.formularioVacio();

  // ==========================================
  // CICLO DE VIDA
  // ==========================================
  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarDatos();
    } else {
      this.cargando = false;
    }
  }

  // ==========================================
  // CARGAR DATOS
  // ==========================================
  cargarDatos(): void {
    this.cargando = true;
    this.errorMensaje = '';
    this.cdr.detectChanges();

    // Primero cargar sedes, después los operadores
    this.sedeService.listar().subscribe({
      next: (sedes) => {
        this.sedes = sedes;

        this.usuarioService.listarPorRol('OPERADOR').subscribe({
          next: (operadores) => {
            console.log('✅ Operadores cargados:', operadores);
            this.operadores = operadores;
            this.cargando = false;
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('❌ Error cargando operadores:', err);
            this.errorMensaje = 'Error al cargar los operadores';
            this.cargando = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        console.error('❌ Error cargando sedes:', err);
        this.errorMensaje = 'Error al cargar las sedes';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ==========================================
  // FILTROS
  // ==========================================
  get operadoresFiltrados(): Usuario[] {
    return this.operadores.filter(o => {
      const cumpleSede = this.filtroSede === 'TODAS' || o.sedeId === Number(this.filtroSede);
      const cumpleEstado = this.filtroEstado === 'TODOS' || 
        (this.filtroEstado === 'ACTIVO' && o.sedeId != null) ||
        (this.filtroEstado === 'SIN_ASIGNAR' && o.sedeId == null);
      return cumpleSede && cumpleEstado;
    });
  }

  // ==========================================
  // FORMULARIO
  // ==========================================
  formularioVacio(): any {
    return {
      nombres: '',
      apellidos: '',
      email: '',
      password: '',
      celular: '',
      rol: 'OPERADOR',
      sedeId: null
    };
  }

  abrirModalCrear(): void {
    this.modoEdicion = false;
    this.operadorForm = this.formularioVacio();
    this.mostrarModal = true;
    this.cdr.detectChanges();
  }

  abrirModalEditar(op: Usuario): void {
    this.modoEdicion = true;
    this.operadorForm = {
      id: op.id,
      nombres: op.nombres,
      apellidos: op.apellidos,
      email: op.email,
      password: '', // No se muestra la contraseña
      celular: op.celular,
      rol: 'OPERADOR',
      sedeId: op.sedeId
    };
    this.mostrarModal = true;
    this.cdr.detectChanges();
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.operadorForm = this.formularioVacio();
    this.cdr.detectChanges();
  }

  // ==========================================
  // GUARDAR
  // ==========================================
  guardar(): void {
    if (!this.validarFormulario()) return;

    this.procesando = true;
    this.cdr.detectChanges();

    if (this.modoEdicion) {
      // ACTUALIZAR
      const payload: any = {
        nombres: this.operadorForm.nombres.trim(),
        apellidos: this.operadorForm.apellidos.trim(),
        celular: this.operadorForm.celular?.trim() || null,
        rol: 'OPERADOR',
        sedeId: this.operadorForm.sedeId
      };

      this.usuarioService.actualizar(this.operadorForm.id, payload).subscribe({
        next: (actualizado) => {
          console.log('✅ Operador actualizado:', actualizado);
          this.operadores = this.operadores.map(o =>
            o.id === actualizado.id ? actualizado : o
          );
          this.procesando = false;
          this.cerrarModal();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('❌ Error actualizando:', err);
          alert(err?.error || 'Error al actualizar el operador');
          this.procesando = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      // CREAR
      const payload: any = {
        nombres: this.operadorForm.nombres.trim(),
        apellidos: this.operadorForm.apellidos.trim(),
        email: this.operadorForm.email.trim().toLowerCase(),
        password: this.operadorForm.password,
        celular: this.operadorForm.celular?.trim() || null,
        rol: 'OPERADOR',
        sedeId: this.operadorForm.sedeId
      };

      this.usuarioService.registrar(payload).subscribe({
        next: (nuevo) => {
          console.log('✅ Operador creado:', nuevo);
          this.operadores = [...this.operadores, nuevo];
          this.procesando = false;
          this.cerrarModal();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('❌ Error creando:', err);
          alert(err?.error || 'Error al crear el operador');
          this.procesando = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  // ==========================================
  // VALIDACIONES
  // ==========================================
  private validarFormulario(): boolean {
    if (!this.operadorForm.nombres?.trim()) {
      alert('El nombre es obligatorio');
      return false;
    }
    if (!this.operadorForm.apellidos?.trim()) {
      alert('Los apellidos son obligatorios');
      return false;
    }
    if (!this.modoEdicion) {
      if (!this.operadorForm.email?.trim()) {
        alert('El email es obligatorio');
        return false;
      }
      if (!this.operadorForm.password || this.operadorForm.password.length < 6) {
        alert('La contraseña debe tener al menos 6 caracteres');
        return false;
      }
    }
    if (!this.operadorForm.sedeId) {
      alert('Debes asignar una sede al operador');
      return false;
    }
    return true;
  }

  // ==========================================
  // HELPERS
  // ==========================================
  getNombreSede(sedeId: number | null | undefined): string {
    if (!sedeId) return '— Sin asignar —';
    const sede = this.sedes.find(s => s.id === sedeId);
    return sede ? sede.nombre : `Sede #${sedeId}`;
  }

  getEstadoOperador(op: Usuario): 'ACTIVO' | 'SIN_ASIGNAR' {
    return op.sedeId ? 'ACTIVO' : 'SIN_ASIGNAR';
  }

  getBadgeClass(op: Usuario): string {
    return this.getEstadoOperador(op) === 'ACTIVO' ? 'b-active' : 'b-pending';
  }

  getBadgeText(op: Usuario): string {
    return this.getEstadoOperador(op) === 'ACTIVO' ? 'Activo' : 'Sin asignar';
  }

  getIniciales(op: Usuario): string {
    return `${op.nombres?.charAt(0) || ''}${op.apellidos?.charAt(0) || ''}`.toUpperCase();
  }
}