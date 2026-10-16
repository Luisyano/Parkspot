import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

// ✅ RUTAS CORRECTAS (idénticas a cliente)
import { SedeService } from '../../../servicios/sede.service';
import { EspacioService } from '../../../servicios/espacio.service';
import { PagoService } from '../../../servicios/pago.service';
import { UsuarioService } from '../../../servicios/usuario.service';
import { IncidenteService } from '../../../servicios/incidente.service';

interface OcupacionSede {
  nombre: string;
  porcentaje: number;
  color: string;
}

interface IngresoModalidad {
  modalidad: string;
  porcentaje: number;
  color: string;
}

interface ActividadReciente {
  icono: string;
  color: string;
  texto: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {

  // ==========================================
  // SERVICIOS
  // ==========================================
  private sedeService = inject(SedeService);
  private espacioService = inject(EspacioService);
  private pagoService = inject(PagoService);
  private usuarioService = inject(UsuarioService);
  private incidenteService = inject(IncidenteService);

  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  // ==========================================
  // ESTADO
  // ==========================================
  cargando: boolean = true;
  errorMensaje: string = '';

  totalSedes: number = 0;
  ingresosTotales: number = 0;
  ocupacionPromedio: number = 0;
  totalUsuarios: number = 0;

  ocupacionPorSede: OcupacionSede[] = [];
  ingresosPorModalidad: IngresoModalidad[] = [];
  ultimasActividades: ActividadReciente[] = [];

  // ==========================================
  // CICLO DE VIDA
  // ==========================================
  ngOnInit(): void {
    // ✅ Verificar si estamos en el navegador (igual que cliente)
    if (isPlatformBrowser(this.platformId)) {
      this.cargarDashboard();
    } else {
      this.cargando = false;
      this.errorMensaje = 'No se puede cargar en el servidor';
    }
  }

  // ==========================================
  // CARGAR DASHBOARD
  // ==========================================
  cargarDashboard(): void {
    this.cargando = true;
    this.errorMensaje = '';
    this.cdr.detectChanges();

    try {
      forkJoin({
        sedes: this.sedeService.listar().pipe(catchError(() => of([]))),
        usuarios: this.usuarioService.listarTodos().pipe(catchError(() => of([]))),
        incidentes: this.incidenteService.listar().pipe(catchError(() => of([])))
      }).subscribe({
        next: ({ sedes, usuarios, incidentes }) => {
          console.log('✅ Sedes:', sedes);
          console.log('✅ Usuarios:', usuarios);
          console.log('✅ Incidentes:', incidentes);

          this.totalSedes = sedes.length;
          this.totalUsuarios = usuarios.length;

          // Cargar actividades desde incidentes
          this.ultimasActividades = (incidentes || []).slice(0, 4).map((i: any) => ({
            icono: this.iconoPorTipo(i.tipo),
            color: this.colorPorEstado(i.estado),
            texto: `Incidente en ${i.codigoEspacio || 'espacio'} · ${this.formatearTipo(i.tipo)}`
          }));

          // Cargar datos por sede
          if (sedes.length > 0) {
            this.cargarDatosPorSede(sedes);
          } else {
            // ✅ IMPORTANTE: Si no hay sedes, quitar el loading
            this.cargando = false;
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          console.error('❌ Error cargando dashboard:', err);
          this.errorMensaje = 'Error al cargar los datos del dashboard';
          this.cargando = false;
          this.cdr.detectChanges();
        }
      });
    } catch (error) {
      console.error('❌ Error inesperado:', error);
      this.errorMensaje = 'Error inesperado al cargar el dashboard';
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  // ==========================================
  // CARGAR DATOS POR CADA SEDE
  // ==========================================
  private cargarDatosPorSede(sedes: any[]): void {
    const peticiones = sedes.map((sede: any) =>
      forkJoin({
        espacios: this.espacioService.listarPorSede(sede.id).pipe(catchError(() => of([]))),
        ingresos: this.pagoService.totalIngresosPorSede(sede.id).pipe(catchError(() => of(0)))
      }).pipe(
        map(({ espacios, ingresos }) => {
          const total = espacios.length;
          const ocupados = espacios.filter((e: any) => e.estado === 'OCUPADO').length;
          const porcentaje = total > 0 ? Math.round((ocupados / total) * 100) : 0;

          return {
            sedeNombre: sede.nombre,
            porcentaje,
            ingresos: ingresos || 0
          };
        })
      )
    );

    forkJoin(peticiones).subscribe({
      next: (resultados) => {
        // Ocupación por sede
        this.ocupacionPorSede = resultados.map(r => ({
          nombre: r.sedeNombre,
          porcentaje: r.porcentaje,
          color: this.colorOcupacion(r.porcentaje)
        }));

        // Promedio
        const conDatos = resultados.filter(r => r.porcentaje > 0);
        this.ocupacionPromedio = conDatos.length > 0
          ? Math.round(conDatos.reduce((sum, r) => sum + r.porcentaje, 0) / conDatos.length)
          : 0;

        // Ingresos totales
        this.ingresosTotales = resultados.reduce((sum, r) => sum + r.ingresos, 0);

        // Ingresos por modalidad (placeholder)
        this.ingresosPorModalidad = [
          { modalidad: 'Mensual', porcentaje: 55, color: 'var(--navy)' },
          { modalidad: 'Por hora', porcentaje: 30, color: 'var(--accent)' },
          { modalidad: 'Anual', porcentaje: 15, color: 'var(--purple)' }
        ];

        // ✅ QUITAR LOADING SIEMPRE
        this.cargando = false;
        this.cdr.detectChanges();
        console.log('✅ Dashboard cargado correctamente');
      },
      error: (err) => {
        console.error('❌ Error cargando datos por sede:', err);
        // ✅ QUITAR LOADING AUNQUE HAYA ERROR
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ==========================================
  // HELPERS
  // ==========================================
  private colorOcupacion(porcentaje: number): string {
    if (porcentaje >= 80) return 'var(--occupied)';
    if (porcentaje >= 60) return 'var(--reserved)';
    return 'var(--available)';
  }

  private colorPorEstado(estado: string): string {
    switch (estado) {
      case 'ABIERTO': return 'var(--reserved)';
      case 'EN_PROCESO': return 'var(--info)';
      case 'RESUELTO': return 'var(--available)';
      case 'CERRADO': return 'var(--ink-3)';
      default: return 'var(--ink-3)';
    }
  }

  private iconoPorTipo(tipo: string): string {
    switch (tipo) {
      case 'ABANDONADO': return 'ti ti-car';
      case 'EXCESO_TIEMPO': return 'ti ti-clock';
      case 'ESTACIONAMIENTO_INDEBIDO': return 'ti ti-alert-triangle';
      case 'DANIO_PROPIEDAD': return 'ti ti-tool';
      case 'SEGURIDAD': return 'ti ti-shield';
      case 'USO_INDEBIDO_CONADIS': return 'ti ti-wheelchair';
      default: return 'ti ti-info-circle';
    }
  }

  private formatearTipo(tipo: string): string {
    return tipo.replace(/_/g, ' ').toLowerCase();
  }
}