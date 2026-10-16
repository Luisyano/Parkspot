import { Component, OnInit, OnDestroy, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { EspacioService } from '../../../servicios/espacio.service';
import { IncidenteService, Incidente } from '../../../servicios/incidente.service';
import { Espacio } from '../../../modelos/espacio';

interface EspacioVista extends Espacio {
  tieneIncidente: boolean;
  colorClase: string;
}

@Component({
  selector: 'app-mapa',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './mapa.html',
  styleUrl: './mapa.css',
})
export class Mapa implements OnInit, OnDestroy {

  private espacioService = inject(EspacioService);
  private incidenteService = inject(IncidenteService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  // ==========================================
  // ESTADO
  // ==========================================
  cargando = true;
  errorMensaje = '';
  sedeId = 0;

  // Datos
  espacios: EspacioVista[] = [];
  espaciosFiltrados: EspacioVista[] = [];
  incidentes: Incidente[] = [];
  espaciosConIncidente: Set<number> = new Set();

  // Filtro por piso
  pisoSeleccionado: number | string = 'TODOS';
  pisosUnicos: number[] = [];

  // KPIs
  totalEspacios = 0;
  totalDisponibles = 0;
  totalReservados = 0;
  totalOcupados = 0;
  totalMantenimiento = 0;
  totalConIncidente = 0;

  // Auto-refresh
  private intervalId: any = null;

  // ==========================================
  // CICLO DE VIDA
  // ==========================================
  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.cargando = false;
      return;
    }

    // Obtener sede del operador
    try {
      const usuarioGuardado = localStorage.getItem('usuario');
      if (usuarioGuardado) {
        const u = JSON.parse(usuarioGuardado);
        this.sedeId = u.sedeId || 0;
      }

      const sedeGuardada = localStorage.getItem('sede');
      if (sedeGuardada) {
        const s = JSON.parse(sedeGuardada);
        this.sedeId = s.id || this.sedeId;
      }
    } catch {
      this.sedeId = 0;
    }

    if (!this.sedeId) {
      this.errorMensaje = 'No se pudo identificar la sede del operador';
      this.cargando = false;
      this.cdr.detectChanges();
      return;
    }

    this.cargarDatos();

    // Auto-refresh cada 30 segundos
    this.intervalId = setInterval(() => this.cargarDatos(), 30000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  // ==========================================
  // CARGAR DATOS
  // ==========================================
  cargarDatos(): void {
    this.cargando = this.espacios.length === 0;
    this.errorMensaje = '';
    this.cdr.detectChanges();

    // 1. Cargar incidentes activos primero
    this.incidenteService.listarUrgentesPorSede(this.sedeId).subscribe({
      next: (incidentes) => {
        this.incidentes = incidentes;
        this.espaciosConIncidente.clear();
        incidentes.forEach(i => {
          if (i.espacioId) this.espaciosConIncidente.add(i.espacioId);
        });

        // 2. Luego cargar espacios
        this.cargarEspacios();
      },
      error: (err) => {
        console.warn('No se pudieron cargar incidentes:', err);
        this.cargarEspacios();
      }
    });
  }

  private cargarEspacios(): void {
    this.espacioService.listarPorSede(this.sedeId).subscribe({
      next: (espacios) => {
        console.log('✅ Espacios cargados:', espacios);
        this.espacios = espacios.map(e => this.enriquecerEspacio(e));
        this.calcularKPIs();
        this.calcularPisosUnicos();
        this.aplicarFiltro();
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

  private enriquecerEspacio(espacio: Espacio): EspacioVista {
    const tieneIncidente = this.espaciosConIncidente.has(espacio.id);
    return {
      ...espacio,
      tieneIncidente,
      colorClase: this.getColorClase(espacio.estado, tieneIncidente)
    };
  }

  // ==========================================
  // KPIs
  // ==========================================
  private calcularKPIs(): void {
    this.totalEspacios = this.espacios.length;
    this.totalDisponibles = this.espacios.filter(e => e.estado === 'DISPONIBLE').length;
    this.totalReservados = this.espacios.filter(e => e.estado === 'RESERVADO').length;
    this.totalOcupados = this.espacios.filter(e => e.estado === 'OCUPADO').length;
    this.totalMantenimiento = this.espacios.filter(e => e.estado === 'MANTENIMIENTO').length;
    this.totalConIncidente = this.espacios.filter(e => e.tieneIncidente).length;
  }

  // ==========================================
  // PISOS
  // ==========================================
  private calcularPisosUnicos(): void {
    const pisos = new Set<number>();
    this.espacios.forEach(e => pisos.add(e.pisoId));
    this.pisosUnicos = Array.from(pisos).sort((a, b) => a - b);
  }

  aplicarFiltro(): void {
    if (this.pisoSeleccionado === 'TODOS') {
      this.espaciosFiltrados = [...this.espacios];
    } else {
      this.espaciosFiltrados = this.espacios.filter(
        e => e.pisoId === Number(this.pisoSeleccionado)
      );
    }
    this.cdr.detectChanges();
  }

  // ==========================================
  // HELPERS
  // ==========================================
  private getColorClase(estado: string, tieneIncidente: boolean): string {
    if (tieneIncidente) return 's-inc';
    switch (estado) {
      case 'DISPONIBLE': return 's-av';
      case 'RESERVADO': return 's-res';
      case 'OCUPADO': return 's-occ';
      case 'MANTENIMIENTO': return 's-mant';
      default: return 's-av';
    }
  }

  getEspaciosOcupados(): EspacioVista[] {
    return this.espacios.filter(e =>
      e.estado === 'OCUPADO' || e.estado === 'RESERVADO' || e.tieneIncidente
    );
  }

  getTextoEstado(estado: string): string {
    const mapa: Record<string, string> = {
      DISPONIBLE: 'Disponible',
      RESERVADO: 'Reservado',
      OCUPADO: 'Ocupado',
      MANTENIMIENTO: 'Mantenimiento'
    };
    return mapa[estado] || estado;
  }

  getTextoPiso(pisoId: number): string {
    return `Piso ${pisoId}`;
  }

  getBadgeClass(estado: string, tieneIncidente: boolean): string {
    if (tieneIncidente) return 'b-inc';
    switch (estado) {
      case 'DISPONIBLE': return 'b-av';
      case 'RESERVADO': return 'b-res';
      case 'OCUPADO': return 'b-occ';
      case 'MANTENIMIENTO': return 'b-neutral';
      default: return 'b-neutral';
    }
  }

  getIncidenteDeEspacio(espacioId: number): Incidente | null {
    return this.incidentes.find(i => i.espacioId === espacioId) || null;
  }

  formatearHora(fecha: string | null | undefined): string {
    if (!fecha) return '—';
    const d = new Date(fecha);
    return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  }
}