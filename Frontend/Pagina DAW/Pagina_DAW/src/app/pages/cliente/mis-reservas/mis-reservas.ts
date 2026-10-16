import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef, NgZone, ApplicationRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ReservaService } from '../../../servicios/reserva.service';
import { EspacioService } from '../../../servicios/espacio.service';
import { VehiculoService } from '../../../servicios/vehiculo.service';
import { Reserva } from '../../../modelos/reserva';
import { Usuario } from '../../../modelos/usuario';

@Component({
  selector: 'app-mis-reservas',
  imports: [RouterLink, CommonModule],
  templateUrl: './mis-reservas.html',
  styleUrl: './mis-reservas.css',
})
export class MisReservas implements OnInit {
  private reservaService = inject(ReservaService);
  private espacioService = inject(EspacioService);
  private vehiculoService = inject(VehiculoService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private appRef = inject(ApplicationRef);

  reservas: Reserva[] = [];
  reservasFiltradas: Reserva[] = [];
  usuario: Usuario | null = null;
  filtroActual: string = 'todas';

  cargando: boolean = true;
  errorMensaje: string = '';
  mensajeExito: string = '';

  paginaActual: number = 0;
  itemsPorPagina: number = 5;
  totalPaginas: number = 0;

  // ✅ Variable de "fuerza bruta"
  forceUpdate: number = 0;

  // ========== MÉTODO trackById para evitar errores en *ngFor ==========
  trackById(index: number, reserva: Reserva): number {
    return reserva.id;
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const usuarioGuardado = localStorage.getItem('usuario');
        if (usuarioGuardado) {
          this.usuario = JSON.parse(usuarioGuardado);
          console.log('✅ Usuario cargado:', this.usuario);
        } else {
          console.warn('⚠️ No hay usuario en localStorage');
        }
      } catch (error) {
        console.error('Error al leer localStorage:', error);
        this.usuario = null;
      }
    }

    // ✅ Ejecutar fuera de Angular para evitar conflictos de hidratación
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        this.ngZone.run(() => {
          if (this.usuario && this.usuario.id) {
            this.cargarReservas();
          } else {
            this.errorMensaje = 'Inicia sesión para ver tus reservas.';
            this.cargando = false;
            this.cdr.detectChanges();
            this.appRef.tick();
          }
        });
      }, 0);
    });
  }

  // ========== GETTERS PARA PAGINACIÓN ==========
  get reservasPaginadas(): Reserva[] {
    const inicio = this.paginaActual * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return this.reservasFiltradas.slice(inicio, fin);
  }

  get paginas(): number[] {
    const paginas: number[] = [];
    for (let i = 0; i < this.totalPaginas; i++) {
      paginas.push(i);
    }
    return paginas;
  }

  // ========== NAVEGACIÓN ==========
  irPagina(pagina: number): void {
    if (pagina >= 0 && pagina < this.totalPaginas) {
      this.paginaActual = pagina;
      this.scrollToTop();
    }
  }

  anterior(): void {
    if (this.paginaActual > 0) {
      this.paginaActual--;
      this.scrollToTop();
    }
  }

  siguiente(): void {
    if (this.paginaActual < this.totalPaginas - 1) {
      this.paginaActual++;
      this.scrollToTop();
    }
  }

  private scrollToTop(): void {
    const container = document.querySelector('.reservas-container');
    if (container) {
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // ========== CARGA DE DATOS ==========
  async cargarReservas(): Promise<void> {
    this.cargando = true;
    this.errorMensaje = '';
    this.cdr.detectChanges();
    console.log('🔄 cargando = true');

    try {
      if (!this.usuario || !this.usuario.id) {
        throw new Error('Usuario no identificado');
      }

      const reservas = await firstValueFrom(
        this.reservaService.listarPorUsuario(this.usuario.id)
      );
      
      this.reservas = reservas || [];
      
      if (this.reservas.length > 0) {
        await this.cargarDetalles(this.reservas);
      }
      
      this.reservasFiltradas = this.reservas;
      
      this.totalPaginas = Math.ceil(this.reservasFiltradas.length / this.itemsPorPagina);
      if (this.paginaActual >= this.totalPaginas && this.totalPaginas > 0) {
        this.paginaActual = this.totalPaginas - 1;
      } else if (this.totalPaginas === 0) {
        this.paginaActual = 0;
      }

      // ✅ FUERZA BRUTA: combinación de todas las técnicas
      this.ngZone.run(() => {
        setTimeout(() => {
          this.cargando = false;
          this.forceUpdate++; // fuerza cambio en el template
          this.cdr.detectChanges();
          this.appRef.tick(); // actualiza toda la aplicación
          console.log('✅ Vista forzada a actualizar');
        }, 0);
      });

    } catch (error) {
      console.error('❌ Error cargando reservas:', error);
      this.errorMensaje = 'Error al cargar tus reservas.';
      this.cargando = false;
      this.reservas = [];
      this.reservasFiltradas = [];
      this.totalPaginas = 0;
      this.paginaActual = 0;
      this.ngZone.run(() => {
        setTimeout(() => {
          this.cdr.detectChanges();
          this.appRef.tick();
        }, 0);
      });
    }
  }

  // ========== CARGAR DETALLES ==========
  async cargarDetalles(reservas: Reserva[]): Promise<void> {
    const promesas: Promise<void>[] = [];

    reservas.forEach(reserva => {
      if (reserva.espacioId) {
        promesas.push(
          firstValueFrom(this.espacioService.buscarPorId(reserva.espacioId))
            .then(espacio => {
              if (espacio) {
                reserva.codigoEspacio = espacio.codigo;
              }
            })
            .catch(() => console.warn('No se pudo cargar espacio:', reserva.espacioId))
        );
      }
      
      if (reserva.vehiculoId) {
        promesas.push(
          firstValueFrom(this.vehiculoService.buscarPorId(reserva.vehiculoId))
            .then(vehiculo => {
              if (vehiculo) {
                reserva.placaVehiculo = vehiculo.placa;
              }
            })
            .catch(() => console.warn('No se pudo cargar vehículo:', reserva.vehiculoId))
        );
      }
    });

    if (promesas.length > 0) {
      await Promise.all(promesas);
    }
  }

  // ========== FILTRADO ==========
  filtrarReservas(filtro: string): void {
    this.filtroActual = filtro;

    if (filtro === 'todas') {
      this.reservasFiltradas = this.reservas;
    } else {
      this.reservasFiltradas = this.reservas.filter((r) => {
        const estado = r.estado?.toLowerCase() || '';
        return estado === filtro;
      });
    }

    this.paginaActual = 0;
    this.totalPaginas = Math.ceil(this.reservasFiltradas.length / this.itemsPorPagina);
    this.cdr.detectChanges();
    this.appRef.tick();
  }

  // ========== CANCELAR ==========
  cancelarReserva(id: number): void {
    if (!confirm('¿Estás seguro de cancelar esta reserva?')) return;

    this.reservaService.cancelar(id).subscribe({
      next: () => {
        this.mensajeExito = '✅ Reserva cancelada correctamente.';
        this.cargarReservas();
        setTimeout(() => this.mensajeExito = '', 4000);
      },
      error: (error) => {
        console.error('Error cancelando reserva:', error);
        this.errorMensaje = error.error?.message || 'Error al cancelar la reserva.';
        setTimeout(() => this.errorMensaje = '', 5000);
      },
    });
  }

  // ========== TOTALES ==========
  getTotalReserva(reserva: Reserva): string {
    if (!reserva.fechaInicio || !reserva.fechaFin) {
      return 'S/ 0.00';
    }

    const plan = reserva.nombrePlan || 'POR_HORA';
    const PRECIO_BASE_POR_HORA = 5.00;

    let total = 0;

    if (plan === 'POR_HORA') {
      const inicio = new Date(reserva.fechaInicio);
      const fin = new Date(reserva.fechaFin);
      const horas = Math.max(1, Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60)));
      total = horas * PRECIO_BASE_POR_HORA;
    } else if (plan === 'MENSUAL') {
      total = PRECIO_BASE_POR_HORA * 30;
    } else if (plan === 'ANUAL') {
      total = PRECIO_BASE_POR_HORA * 365 * 0.75;
    }

    return `S/ ${total.toFixed(2)}`;
  }

  getEstadoBadge(estado: string): string {
    const mapa: Record<string, string> = {
      'PENDIENTE': 'pendiente',
      'CONFIRMADA': 'confirmada',
      'ACTIVA': 'confirmada',
      'FINALIZADA': 'finalizada',
      'CANCELADA': 'cancelada',
      'EXCEDIDA': 'cancelada',
    };
    return mapa[estado] || 'pendiente';
  }

  getEstadoTexto(estado: string): string {
    const mapa: Record<string, string> = {
      'PENDIENTE': 'Pendiente',
      'CONFIRMADA': 'Confirmada',
      'ACTIVA': 'En curso',
      'FINALIZADA': 'Finalizada',
      'CANCELADA': 'Cancelada',
      'EXCEDIDA': 'Excedida',
    };
    return mapa[estado] || estado;
  }

  getNombrePlan(plan: string): string {
    const mapa: Record<string, string> = {
      'POR_HORA': 'Por hora',
      'MENSUAL': 'Mensual',
      'ANUAL': 'Anual',
    };
    return mapa[plan] || plan;
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '—';
    const d = new Date(fecha);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const año = d.getFullYear();
    const horas = String(d.getHours()).padStart(2, '0');
    const minutos = String(d.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${año} ${horas}:${minutos}`;
  }
}