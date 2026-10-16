import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef, NgZone, ApplicationRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ReservaService } from '../../../servicios/reserva.service';
import { PlanService } from '../../../servicios/plan.service';
import { Reserva } from '../../../modelos/reserva';
import { Usuario } from '../../../modelos/usuario';
import { Plan } from '../../../modelos/plan';

@Component({
  selector: 'app-membresias',
  imports: [RouterLink, CommonModule],
  templateUrl: './membresias.html',
  styleUrl: './membresias.css',
})
export class Membresias implements OnInit {
  private reservaService = inject(ReservaService);
  private planService = inject(PlanService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private appRef = inject(ApplicationRef);

  usuario: Usuario | null = null;
  reservas: Reserva[] = [];
  membresiasActivas: Reserva[] = [];
  historialMembresias: Reserva[] = [];

  membresiaActiva: Reserva | null = null;
  nombrePlanActivo: string = '';
  precioPagado: number = 0;
  descuentoAplicado: number = 0;
  diasRestantes: number = 0;
  esPendiente: boolean = false;

  cargando: boolean = true;
  errorMensaje: string = '';
  forceUpdate: number = 0;

  private PRECIO_BASE_POR_HORA = 5.00;

  ngOnInit(): void {
    this.cargarUsuario();
  }

  trackById(index: number, item: Reserva): number {
    return item.id;
  }

  cargarUsuario(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const usuarioGuardado = localStorage.getItem('usuario');
      if (usuarioGuardado) {
        this.usuario = JSON.parse(usuarioGuardado);
        console.log('✅ Usuario cargado en Membresías:', this.usuario);
        if (this.usuario?.id) {
          this.cargarReservas();
        } else {
          this.cargando = false;
          this.errorMensaje = 'Inicia sesión para ver tus membresías.';
          this.cdr.detectChanges();
          this.appRef.tick();
        }
      } else {
        this.cargando = false;
        this.errorMensaje = 'Inicia sesión para ver tus membresías.';
        this.cdr.detectChanges();
        this.appRef.tick();
      }
    } catch (error) {
      console.error('Error al cargar usuario:', error);
      this.cargando = false;
      this.errorMensaje = 'Error al cargar tus datos.';
      this.cdr.detectChanges();
      this.appRef.tick();
    }
  }

  async cargarReservas(): Promise<void> {
    this.cargando = true;
    this.errorMensaje = '';
    this.cdr.detectChanges();
    console.log('🔄 Cargando reservas para membresías...');

    try {
      if (!this.usuario?.id) throw new Error('Usuario no identificado');

      const reservas = await firstValueFrom(
        this.reservaService.listarPorUsuario(this.usuario.id)
      );
      this.reservas = reservas || [];
      console.log('📦 Reservas recibidas:', this.reservas);

      // Filtrar solo planes MENSUAL y ANUAL (membresías)
      const membresias = this.reservas.filter(r =>
        r.nombrePlan === 'MENSUAL' || r.nombrePlan === 'ANUAL'
      );
      console.log('📋 Membresías encontradas:', membresias);

      const ahora = new Date();

      // ✅ AHORA INCLUYE PENDIENTE
      // Activas: CONFIRMADA, ACTIVA o PENDIENTE con fecha fin futura
      this.membresiasActivas = membresias.filter(r => {
        const fin = new Date(r.fechaFin);
        const estadosActivos = ['CONFIRMADA', 'ACTIVA', 'PENDIENTE'];
        return estadosActivos.includes(r.estado || '') && fin >= ahora;
      });

      // Historial: expiradas, canceladas o finalizadas (excluye PENDIENTE)
      this.historialMembresias = membresias.filter(r => {
        const fin = new Date(r.fechaFin);
        return (r.estado === 'CANCELADA' || r.estado === 'FINALIZADA' || fin < ahora);
      });

      console.log('✅ Activas (incluye pendientes):', this.membresiasActivas.length);
      console.log('✅ Historial:', this.historialMembresias.length);

      // Tomar la primera membresía activa (la más reciente por fecha de inicio)
      if (this.membresiasActivas.length > 0) {
        this.membresiasActivas.sort((a, b) =>
          new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime()
        );
        this.membresiaActiva = this.membresiasActivas[0];
        this.esPendiente = this.membresiaActiva.estado === 'PENDIENTE';
        await this.calcularDetallesMembresia(this.membresiaActiva);
      }

      this.cargando = false;
      this.forceUpdate++;
      this.cdr.detectChanges();
      this.appRef.tick();
      console.log('✅ Membresías cargadas correctamente');

    } catch (error) {
      console.error('❌ Error al cargar reservas:', error);
      this.errorMensaje = 'Error al cargar tus membresías.';
      this.cargando = false;
      this.cdr.detectChanges();
      this.appRef.tick();
    }
  }

  async calcularDetallesMembresia(reserva: Reserva): Promise<void> {
    try {
      if (reserva.planId) {
        const plan = await firstValueFrom(this.planService.buscarPorId(reserva.planId));
        if (plan) {
          const precioBase = plan.precioBase;
          const descuento = plan.descuentoPorcentaje || 0;
          const precioFinal = precioBase - (precioBase * (descuento / 100));
          this.precioPagado = precioFinal;
          this.descuentoAplicado = descuento;
          this.nombrePlanActivo = this.getNombrePlan(reserva.nombrePlan || '');
          console.log('📊 Plan cargado:', plan.nombre, 'Precio final:', precioFinal);
        }
      }

      if (reserva.fechaFin) {
        const fin = new Date(reserva.fechaFin);
        const ahora = new Date();
        const diffTime = fin.getTime() - ahora.getTime();
        this.diasRestantes = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      }
    } catch (e) {
      console.warn('Error al obtener detalles del plan:', e);
    }
  }

  getNombrePlan(nombre: string): string {
    const mapa: Record<string, string> = {
      'MENSUAL': 'Mensual',
      'ANUAL': 'Anual',
      'POR_HORA': 'Por hora'
    };
    return mapa[nombre] || nombre;
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '—';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getEstadoTexto(estado: string): string {
    const mapa: Record<string, string> = {
      'CONFIRMADA': 'Activa',
      'ACTIVA': 'Activa',
      'PENDIENTE': 'Pendiente',
      'FINALIZADA': 'Finalizada',
      'CANCELADA': 'Cancelada',
      'EXCEDIDA': 'Excedida'
    };
    return mapa[estado] || estado;
  }

  getTotalReserva(reserva: Reserva): string {
    if (!reserva.fechaInicio || !reserva.fechaFin) {
      return '0.00';
    }

    const plan = reserva.nombrePlan || 'POR_HORA';
    let total = 0;

    if (plan === 'MENSUAL') {
      total = this.PRECIO_BASE_POR_HORA * 30;
    } else if (plan === 'ANUAL') {
      total = this.PRECIO_BASE_POR_HORA * 365 * 0.75;
    } else if (plan === 'POR_HORA') {
      const inicio = new Date(reserva.fechaInicio);
      const fin = new Date(reserva.fechaFin);
      const horas = Math.max(1, Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60)));
      total = horas * this.PRECIO_BASE_POR_HORA;
    }

    return total.toFixed(2);
  }

  // ✅ Nuevo método para mostrar el badge correcto
  getBadgeTexto(estado: string): string {
    if (estado === 'PENDIENTE') {
      return 'Pendiente de pago';
    }
    if (estado === 'CONFIRMADA' || estado === 'ACTIVA') {
      return `Vence en ${this.diasRestantes} días`;
    }
    return this.getEstadoTexto(estado);
  }

  // ✅ Método para saber si mostrar el badge de vencimiento
  mostrarVencimiento(estado: string): boolean {
    return estado === 'CONFIRMADA' || estado === 'ACTIVA';
  }
}