import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// ✅ ALIAS: la interface "Incidente" del servicio se llama "IncidenteModel" aquí
import { IncidenteService, Incidente as IncidenteModel } from '../../../servicios/incidente.service';
import { EspacioService } from '../../../servicios/espacio.service';
import { Espacio } from '../../../modelos/espacio';

type Paso = 'formulario' | 'exito';

@Component({
  selector: 'app-incidente',
  imports: [CommonModule, FormsModule],
  templateUrl: './incidente.html',
  styleUrl: './incidente.css',
})
export class Incidente implements OnInit {

  private incidenteService = inject(IncidenteService);
  private espacioService = inject(EspacioService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  // ==========================================
  // ESTADO
  // ==========================================
  paso: Paso = 'formulario';
  cargando = true;
  procesando = false;
  errorMensaje = '';

  operadorId = 0;
  sedeId = 0;

  // Formulario
  espacioIdSeleccionado: number | null = null;
  tipoSeleccionado = '';
  descripcion = '';

  // Datos
  espacios: Espacio[] = [];

  // ✅ Usa el alias IncidenteModel
  incidenteCreado: IncidenteModel | null = null;

  tiposIncidente = [
    { valor: 'ABANDONADO', etiqueta: 'Vehículo abandonado', icono: 'ti ti-car' },
    { valor: 'EXCESO_TIEMPO', etiqueta: 'Exceso de tiempo', icono: 'ti ti-clock-exclamation' },
    { valor: 'ESTACIONAMIENTO_INDEBIDO', etiqueta: 'Estacionamiento indebido', icono: 'ti ti-alert-triangle' },
    { valor: 'DANIO_PROPIEDAD', etiqueta: 'Daño a propiedad', icono: 'ti ti-tool' },
    { valor: 'SEGURIDAD', etiqueta: 'Seguridad', icono: 'ti ti-shield-exclamation' },
    { valor: 'USO_INDEBIDO_CONADIS', etiqueta: 'Uso indebido CONADIS', icono: 'ti ti-wheelchair' }
  ];

  // ==========================================
  // CICLO DE VIDA
  // ==========================================
  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.cargando = false;
      return;
    }

    try {
      const usuarioGuardado = localStorage.getItem('usuario');
      if (usuarioGuardado) {
        const u = JSON.parse(usuarioGuardado);
        this.operadorId = u.id;
        this.sedeId = u.sedeId || 0;
      }

      const sedeGuardada = localStorage.getItem('sede');
      if (sedeGuardada) {
        const s = JSON.parse(sedeGuardada);
        this.sedeId = s.id || this.sedeId;
      }
    } catch {
      this.operadorId = 0;
    }

    if (!this.operadorId) {
      this.errorMensaje = 'No se pudo identificar al operador';
      this.cargando = false;
      this.cdr.detectChanges();
      return;
    }

    if (!this.sedeId) {
      this.errorMensaje = 'No tienes una sede asignada';
      this.cargando = false;
      this.cdr.detectChanges();
      return;
    }

    this.cargarEspacios();
  }

  // ==========================================
  // CARGAR ESPACIOS
  // ==========================================
  private cargarEspacios(): void {
    this.cargando = true;
    this.cdr.detectChanges();

    this.espacioService.listarPorSede(this.sedeId).subscribe({
      next: (espacios) => {
        console.log('✅ Espacios cargados:', espacios);
        this.espacios = espacios;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error cargando espacios:', err);
        this.errorMensaje = 'Error al cargar los espacios';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ==========================================
  // REPORTAR INCIDENTE
  // ==========================================
  reportar(): void {
    if (!this.tipoSeleccionado) {
      this.errorMensaje = 'Debes seleccionar un tipo de incidente';
      setTimeout(() => this.errorMensaje = '', 4000);
      return;
    }

    if (!this.descripcion.trim()) {
      this.errorMensaje = 'Debes describir el incidente';
      setTimeout(() => this.errorMensaje = '', 4000);
      return;
    }

    if (this.descripcion.trim().length < 10) {
      this.errorMensaje = 'La descripción debe tener al menos 10 caracteres';
      setTimeout(() => this.errorMensaje = '', 4000);
      return;
    }

    this.procesando = true;
    this.errorMensaje = '';
    this.cdr.detectChanges();

    const nuevoIncidente: any = {
      operadorId: this.operadorId,
      tipo: this.tipoSeleccionado,
      descripcion: this.descripcion.trim(),
      estado: 'ABIERTO'
    };

    if (this.espacioIdSeleccionado) {
      nuevoIncidente.espacioId = this.espacioIdSeleccionado;
    }

    console.log('📤 Enviando incidente:', nuevoIncidente);

    this.incidenteService.reportar(nuevoIncidente).subscribe({
      next: (incidente) => {
        console.log('✅ Incidente creado:', incidente);
        this.incidenteCreado = incidente;
        this.paso = 'exito';
        this.procesando = false;
        this.cdr.detectChanges();

        setTimeout(() => {
          this.router.navigate(['/operador/dashboard']);
        }, 3000);
      },
      error: (err) => {
        console.error('❌ Error creando incidente:', err);

        let mensaje = 'Error al reportar el incidente';
        if (err.status === 400) {
          if (typeof err.error === 'string') {
            mensaje = err.error;
          } else if (err.error?.message) {
            mensaje = err.error.message;
          }
        } else if (err.status === 0) {
          mensaje = 'No se pudo conectar con el servidor';
        }

        this.errorMensaje = mensaje;
        this.procesando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ==========================================
  // RESET
  // ==========================================
  resetearFormulario(): void {
    this.espacioIdSeleccionado = null;
    this.tipoSeleccionado = '';
    this.descripcion = '';
    this.errorMensaje = '';
    this.paso = 'formulario';
  }

  // ==========================================
  // HELPERS
  // ==========================================
  getIconoTipo(tipo: string): string {
    const found = this.tiposIncidente.find(t => t.valor === tipo);
    return found ? found.icono : 'ti ti-alert-triangle';
  }

  getEtiquetaTipo(tipo: string): string {
    const found = this.tiposIncidente.find(t => t.valor === tipo);
    return found ? found.etiqueta : tipo;
  }

  getCodigoEspacio(espacioId: number | null | undefined): string {
    if (!espacioId) return '—';
    const espacio = this.espacios.find(e => e.id === espacioId);
    return espacio ? espacio.codigo : '—';
  }
}