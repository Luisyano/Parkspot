import { Component, OnInit, OnDestroy, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

import { IncidenteService, Incidente } from '../../../servicios/incidente.service';

@Component({
  selector: 'app-alertas',
  imports: [CommonModule, RouterLink],
  templateUrl: './alertas.html',
  styleUrl: './alertas.css',
})
export class Alertas implements OnInit, OnDestroy {

  private incidenteService = inject(IncidenteService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  // ==========================================
  // ESTADO
  // ==========================================
  cargando = true;
  errorMensaje = '';
  sedeId = 0;

  // Datos agrupados
  criticas: Incidente[] = [];       // ABIERTO
  enProceso: Incidente[] = [];      // EN_PROCESO
  resueltas: Incidente[] = [];      // RESUELTO + CERRADO

  // Filtro
  filtroActivo: 'TODAS' | 'ABIERTAS' | 'RESUELTAS' = 'TODAS';

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

    // Obtener sede
    try {
      const u = JSON.parse(localStorage.getItem('usuario') || '{}');
      this.sedeId = u.sedeId || 0;
      const s = JSON.parse(localStorage.getItem('sede') || '{}');
      this.sedeId = s.id || this.sedeId;
    } catch {
      this.sedeId = 0;
    }

    if (!this.sedeId) {
      this.errorMensaje = 'No se pudo identificar la sede';
      this.cargando = false;
      this.cdr.detectChanges();
      return;
    }

    this.cargarAlertas();
    this.intervalId = setInterval(() => this.cargarAlertas(), 30000); // cada 30s
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  // ==========================================
  // CARGAR ALERTAS
  // ==========================================
  cargarAlertas(): void {
    this.cargando = this.criticas.length === 0 && this.enProceso.length === 0;
    this.errorMensaje = '';
    this.cdr.detectChanges();

    this.incidenteService.listarPorSede(this.sedeId).subscribe({
      next: (incidentes) => {
        console.log('✅ Incidentes cargados:', incidentes);

        this.criticas = incidentes.filter(i => i.estado === 'ABIERTO');
        this.enProceso = incidentes.filter(i => i.estado === 'EN_PROCESO');
        this.resueltas = incidentes.filter(i =>
          i.estado === 'RESUELTO' || i.estado === 'CERRADO'
        );

        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error cargando incidentes:', err);
        this.errorMensaje = 'Error al cargar las alertas';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ==========================================
  // HELPERS
  // ==========================================
  get totalAbiertas(): number {
    return this.criticas.length + this.enProceso.length;
  }

  get mostrarCriticas(): boolean {
    return this.filtroActivo !== 'RESUELTAS' && this.criticas.length > 0;
  }

  get mostrarEnProceso(): boolean {
    return this.filtroActivo !== 'RESUELTAS' && this.enProceso.length > 0;
  }

  get mostrarResueltas(): boolean {
    return this.filtroActivo !== 'ABIERTAS' && this.resueltas.length > 0;
  }

  get nadaQueMostrar(): boolean {
    return !this.mostrarCriticas && !this.mostrarEnProceso && !this.mostrarResueltas;
  }

  getIconoTipo(tipo: string): string {
    const mapa: Record<string, string> = {
      ABANDONADO: 'ti ti-car',
      EXCESO_TIEMPO: 'ti ti-clock-exclamation',
      ESTACIONAMIENTO_INDEBIDO: 'ti ti-alert-triangle',
      DANIO_PROPIEDAD: 'ti ti-tool',
      SEGURIDAD: 'ti ti-shield-exclamation',
      USO_INDEBIDO_CONADIS: 'ti ti-wheelchair'
    };
    return mapa[tipo] || 'ti ti-alert-triangle';
  }

  getEtiquetaTipo(tipo: string): string {
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

  formatearHora(fecha: string | null | undefined): string {
    if (!fecha) return '—';
    const d = new Date(fecha);
    return d.toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  tiempoTranscurrido(fecha: string): string {
    if (!fecha) return '';
    const ahora = new Date();
    const f = new Date(fecha);
    const diffMin = Math.floor((ahora.getTime() - f.getTime()) / 60000);

    if (diffMin < 1) return 'Ahora';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    const horas = Math.floor(diffMin / 60);
    if (horas < 24) return `Hace ${horas}h`;
    const dias = Math.floor(horas / 24);
    return `Hace ${dias}d`;
  }

  setFiltro(filtro: 'TODAS' | 'ABIERTAS' | 'RESUELTAS'): void {
    this.filtroActivo = filtro;
    this.cdr.detectChanges();
  }
}