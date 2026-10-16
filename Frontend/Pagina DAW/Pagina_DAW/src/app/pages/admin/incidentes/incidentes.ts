import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IncidenteService, Incidente } from '../../../servicios/incidente.service';
import { Usuario } from '../../../modelos/usuario';

@Component({
  selector: 'app-incidentes',
  imports: [CommonModule, FormsModule],
  templateUrl: './incidentes.html',
  styleUrl: './incidentes.css',
})
export class Incidentes implements OnInit {

  private incidenteService = inject(IncidenteService);
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
  incidentes: Incidente[] = [];
  adminActual: Usuario | null = null;

  // Filtros
  filtroEstado: string = 'TODOS';
  filtroTipo: string = 'TODOS';

  // ==========================================
  // MODAL DE SOLUCIÓN
  // ==========================================
  mostrarModal = false;
  incidenteSeleccionado: Incidente | null = null;
  solucionTexto = '';

  // ==========================================
  // CICLO DE VIDA
  // ==========================================
  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Cargar admin actual desde localStorage
      try {
        const usuarioGuardado = localStorage.getItem('usuario');
        if (usuarioGuardado) {
          this.adminActual = JSON.parse(usuarioGuardado);
        }
      } catch {
        this.adminActual = null;
      }

      this.cargarIncidentes();
    } else {
      this.cargando = false;
    }
  }

  // ==========================================
  // CARGAR INCIDENTES
  // ==========================================
  cargarIncidentes(): void {
    this.cargando = true;
    this.errorMensaje = '';
    this.cdr.detectChanges();

    this.incidenteService.listar().subscribe({
      next: (incidentes) => {
        console.log('✅ Incidentes cargados:', incidentes);
        this.incidentes = incidentes;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error cargando incidentes:', err);
        this.errorMensaje = 'Error al cargar los incidentes';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ==========================================
  // FILTROS
  // ==========================================
  get incidentesFiltrados(): Incidente[] {
    return this.incidentes.filter(i => {
      const cumpleEstado = this.filtroEstado === 'TODOS' || i.estado === this.filtroEstado;
      const cumpleTipo = this.filtroTipo === 'TODOS' || i.tipo === this.filtroTipo;
      return cumpleEstado && cumpleTipo;
    });
  }

  get tiposUnicos(): string[] {
    return [...new Set(this.incidentes.map(i => i.tipo))].sort();
  }

  get contadorAbiertos(): number {
    return this.incidentes.filter(i => i.estado === 'ABIERTO' || i.estado === 'EN_PROCESO').length;
  }

  // ==========================================
  // MODAL RESOLVER
  // ==========================================
  abrirModalResolver(incidente: Incidente): void {
    this.incidenteSeleccionado = incidente;
    this.solucionTexto = incidente.solucion || '';
    this.mostrarModal = true;
    this.cdr.detectChanges();
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.incidenteSeleccionado = null;
    this.solucionTexto = '';
    this.cdr.detectChanges();
  }

  // ==========================================
  // RESOLVER INCIDENTE
  // ==========================================
  resolver(): void {
    if (!this.incidenteSeleccionado || !this.adminActual) return;

    if (!this.solucionTexto.trim()) {
      alert('Debes escribir una solución');
      return;
    }

    if (this.solucionTexto.trim().length < 10) {
      alert('La solución debe tener al menos 10 caracteres');
      return;
    }

    this.procesando = true;
    this.cdr.detectChanges();

    this.incidenteService
      .resolver(this.incidenteSeleccionado.id, this.adminActual.id, this.solucionTexto.trim())
      .subscribe({
        next: (actualizado) => {
          console.log('✅ Incidente resuelto:', actualizado);
          this.incidentes = this.incidentes.map(i =>
            i.id === actualizado.id ? actualizado : i
          );
          this.procesando = false;
          this.cerrarModal();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('❌ Error resolviendo incidente:', err);
          alert(err?.error || 'Error al resolver el incidente');
          this.procesando = false;
          this.cdr.detectChanges();
        }
      });
  }

  // ==========================================
  // HELPERS
  // ==========================================
  getTipoTexto(tipo: string): string {
    const mapa: Record<string, string> = {
      ABANDONADO: 'Vehículo abandonado',
      EXCESO_TIEMPO: 'Exceso de tiempo',
      ESTACIONAMIENTO_INDEBIDO: 'Estacionamiento indebido',
      DANIO_PROPIEDAD: 'Daño a propiedad',
      SEGURIDAD: 'Seguridad',
      USO_INDEBIDO_CONADIS: 'Uso indebido CONADIS'
    };
    return mapa[tipo] || tipo;
  }

  getEstadoTexto(estado: string): string {
    const mapa: Record<string, string> = {
      ABIERTO: 'Abierto',
      EN_PROCESO: 'En proceso',
      RESUELTO: 'Resuelto',
      CERRADO: 'Cerrado'
    };
    return mapa[estado] || estado;
  }

  getEstadoBadgeClass(estado: string): string {
    const mapa: Record<string, string> = {
      ABIERTO: 'b-open',
      EN_PROCESO: 'b-process',
      RESUELTO: 'b-resolved',
      CERRADO: 'b-closed'
    };
    return mapa[estado] || 'b-neutral';
  }

  getIconoTipo(tipo: string): string {
    const mapa: Record<string, string> = {
      ABANDONADO: 'ti ti-car',
      EXCESO_TIEMPO: 'ti ti-clock',
      ESTACIONAMIENTO_INDEBIDO: 'ti ti-alert-triangle',
      DANIO_PROPIEDAD: 'ti ti-tool',
      SEGURIDAD: 'ti ti-shield',
      USO_INDEBIDO_CONADIS: 'ti ti-wheelchair'
    };
    return mapa[tipo] || 'ti ti-info-circle';
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '—';
    const d = new Date(fecha);
    return d.toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // ¿Se puede resolver este incidente?
  puedeResolver(i: Incidente): boolean {
    return i.estado === 'ABIERTO' || i.estado === 'EN_PROCESO';
  }
}