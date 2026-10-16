import { Component, OnInit, OnDestroy, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

import { EspacioService } from '../../../servicios/espacio.service';
import { IncidenteService, Incidente } from '../../../servicios/incidente.service';
import { ReservaService } from '../../../servicios/reserva.service';
import { Espacio } from '../../../modelos/espacio';
import { Reserva } from '../../../modelos/reserva';

interface OcupacionPiso {
  piso: number;
  total: number;
  ocupados: number;
  porcentaje: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, OnDestroy {

  private espacioService = inject(EspacioService);
  private incidenteService = inject(IncidenteService);
  private reservaService = inject(ReservaService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  // ==========================================
  // ESTADO
  // ==========================================
  cargando = true;
  errorMensaje = '';

  // Datos del operador
  operador: any = null;
  sedeId = 0;
  nombreOperador = 'Operador';

  // KPIs
  totalEspacios = 0;
  disponibles = 0;
  reservados = 0;
  ocupados = 0;
  mantenimiento = 0;

  // Listas
  espacios: Espacio[] = [];
  incidentes: Incidente[] = [];
  ticketsPendientes: Reserva[] = [];
  ocupacionPorPiso: OcupacionPiso[] = [];

  // Reloj
  horaActual = '';
  private intervalId: any = null;

  // ==========================================
  // CICLO DE VIDA
  // ==========================================
  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarSesion();
    } else {
      this.cargando = false;
    }
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  // ==========================================
  // CARGAR SESIÓN DEL OPERADOR
  // ==========================================
  private cargarSesion(): void {
    try {
      const usuarioGuardado = localStorage.getItem('usuario');
      const sedeGuardada = localStorage.getItem('sede');

      if (usuarioGuardado) {
        const u = JSON.parse(usuarioGuardado);
        this.operador = u;
        this.nombreOperador =
          `${u.nombres || ''} ${u.apellidos || ''}`.trim() || 'Operador';
        this.sedeId = u.sedeId || 0;
      }

      if (sedeGuardada) {
        const s = JSON.parse(sedeGuardada);
        this.sedeId = s.id || this.sedeId;
      }

      if (!this.sedeId) {
        this.errorMensaje = 'No tienes una sede asignada. Contacta al administrador.';
        this.cargando = false;
        this.cdr.detectChanges();
        return;
      }

      this.iniciarReloj();
      this.cargarDatos();

    } catch (e) {
      console.error('Error cargando sesión:', e);
      this.errorMensaje = 'Error al cargar la sesión';
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  // ==========================================
  // RELOJ (cada minuto)
  // ==========================================
  private iniciarReloj(): void {
    this.actualizarHora();
    this.intervalId = setInterval(() => this.actualizarHora(), 60000);
  }

  private actualizarHora(): void {
    const ahora = new Date();
    const hh = String(ahora.getHours()).padStart(2, '0');
    const mm = String(ahora.getMinutes()).padStart(2, '0');
    this.horaActual = `${hh}:${mm}`;
  }

  // ==========================================
  // CARGAR DATOS DE LA SEDE
  // ==========================================
  cargarDatos(): void {
    this.cargando = true;
    this.errorMensaje = '';
    this.cdr.detectChanges();

    // 1. Espacios de la sede
    this.espacioService.listarPorSede(this.sedeId).subscribe({
      next: (espacios) => {
        console.log('✅ Espacios cargados:', espacios);
        this.espacios = espacios;
        this.calcularKPIs(espacios);
        this.calcularOcupacionPorPiso(espacios);

        // 2. Incidentes urgentes
        this.cargarIncidentes();

        // 3. Tickets pendientes
        this.cargarTicketsPendientes();

        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error cargando espacios:', err);
        this.errorMensaje = 'Error al cargar los espacios de la sede';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ==========================================
  // KPIs
  // ==========================================
  private calcularKPIs(espacios: Espacio[]): void {
    this.totalEspacios = espacios.length;
    this.disponibles = espacios.filter(e => e.estado === 'DISPONIBLE').length;
    this.reservados = espacios.filter(e => e.estado === 'RESERVADO').length;
    this.ocupados = espacios.filter(e => e.estado === 'OCUPADO').length;
    this.mantenimiento = espacios.filter(e => e.estado === 'MANTENIMIENTO').length;
  }

  // ==========================================
  // OCUPACIÓN POR PISO
  // ==========================================
  private calcularOcupacionPorPiso(espacios: Espacio[]): void {
    const mapa = new Map<number, { total: number; ocupados: number }>();

    espacios.forEach(e => {
      const pisoId = e.pisoId;
      if (!mapa.has(pisoId)) {
        mapa.set(pisoId, { total: 0, ocupados: 0 });
      }
      const data = mapa.get(pisoId)!;
      data.total++;
      if (e.estado === 'OCUPADO') data.ocupados++;
    });

    this.ocupacionPorPiso = Array.from(mapa.entries())
      .map(([piso, data]) => ({
        piso,
        total: data.total,
        ocupados: data.ocupados,
        porcentaje: data.total > 0 ? Math.round((data.ocupados / data.total) * 100) : 0
      }))
      .sort((a, b) => a.piso - b.piso);
  }

  // ==========================================
  // INCIDENTES URGENTES
  // ==========================================
  private cargarIncidentes(): void {
    this.incidenteService.listarUrgentesPorSede(this.sedeId).subscribe({
      next: (incidentes) => {
        console.log('✅ Incidentes urgentes:', incidentes);
        this.incidentes = incidentes;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.warn('Error cargando incidentes:', err);
        this.incidentes = [];
        this.cdr.detectChanges();
      }
    });
  }

  // ==========================================
  // TICKETS PENDIENTES
  // ==========================================
  private cargarTicketsPendientes(): void {
    const espaciosConReserva = this.espacios.filter(e =>
      e.estado === 'RESERVADO' || e.estado === 'OCUPADO'
    );

    if (espaciosConReserva.length === 0) {
      this.ticketsPendientes = [];
      this.cdr.detectChanges();
      return;
    }

    const peticiones = espaciosConReserva.slice(0, 5).map(e =>
      this.reservaService.listarPorEspacio(e.id).toPromise().catch(() => [])
    );

    Promise.all(peticiones).then(resultados => {
      const todas: Reserva[] = [];
      resultados.forEach(reservas => {
        if (reservas) todas.push(...reservas);
      });

      this.ticketsPendientes = todas
        .filter(r => r.estado === 'CONFIRMADA')
        .slice(0, 5);

      this.cdr.detectChanges();
    });
  }

  // ==========================================
  // HELPERS
  // ==========================================
  getPorcentaje(valor: number): number {
    if (this.totalEspacios === 0) return 0;
    return Math.round((valor / this.totalEspacios) * 100);
  }

  getColorOcupacion(porcentaje: number): string {
    if (porcentaje >= 80) return 'var(--occupied)';
    if (porcentaje >= 60) return 'var(--reserved)';
    return 'var(--available)';
  }

  formatearHora(fecha: string): string {
    if (!fecha) return '—';
    const d = new Date(fecha);
    return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  }

  getTipoIncidenteTexto(tipo: string): string {
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

  getIconoIncidente(tipo: string): string {
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
}