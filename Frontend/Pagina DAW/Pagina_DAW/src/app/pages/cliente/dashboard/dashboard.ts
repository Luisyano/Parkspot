import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { ReservaService } from '../../../servicios/reserva.service';
import { VehiculoService } from '../../../servicios/vehiculo.service';
import { Reserva } from '../../../modelos/reserva';
import { Usuario } from '../../../modelos/usuario';
import { Vehiculo } from '../../../modelos/vehiculo';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private reservaService = inject(ReservaService);
  private vehiculoService = inject(VehiculoService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  cargando: boolean = true;
  errorMensaje: string = '';
  usuario: Usuario | null = null;
  reservasRecientes: Reserva[] = [];
  reservaActiva: Reserva | null = null;
  membresiaActiva: string = 'Sin membresía activa';
  venceMembresia: number = 0;
  gastosMes: number = 0;
  totalReservas: number = 0;
  vehiculos: Vehiculo[] = [];

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarUsuario();
    } else {
      this.cargando = false;
      this.errorMensaje = 'No se puede cargar en el servidor';
    }
  }

  cargarUsuario(): void {
    try {
      const usuarioGuardado = localStorage.getItem('usuario');
      if (usuarioGuardado) {
        this.usuario = JSON.parse(usuarioGuardado);
        console.log('✅ Usuario cargado:', this.usuario);
        this.cargarDatosUsuario();
      } else {
        this.errorMensaje = 'No has iniciado sesión. Por favor, inicia sesión.';
        this.cargando = false;
        this.cdr.detectChanges();
        setTimeout(() => {
          if (isPlatformBrowser(this.platformId)) {
            window.location.href = '/login';
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Error al leer localStorage:', error);
      this.errorMensaje = 'Error al cargar los datos del usuario';
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  cargarDatosUsuario(): void {
    if (!this.usuario) {
      this.cargando = false;
      this.cdr.detectChanges();
      return;
    }

    this.cargando = true;
    this.errorMensaje = '';
    this.cdr.detectChanges();

    // 1. Cargar reservas
    this.reservaService.listarPorUsuario(this.usuario.id).subscribe({
      next: (reservas) => {
        console.log('✅ Reservas cargadas:', reservas);
        
        const ahora = new Date();
        const mesActual = ahora.getMonth();
        const añoActual = ahora.getFullYear();

        // Reservas recientes (últimas 5)
        this.reservasRecientes = reservas ? reservas.slice(0, 5) : [];
        
        // Buscar reserva activa (CONFIRMADA o ACTIVA)
        this.reservaActiva = reservas ? reservas.find(r => 
          r.estado === 'ACTIVA' || r.estado === 'CONFIRMADA'
        ) || null : null;
        
        this.totalReservas = reservas ? reservas.length : 0;

        // Gastos del mes (simplificado: 10 soles por reserva)
        const reservasMes = reservas ? reservas.filter(r => {
          const fecha = new Date(r.fechaCreacion || r.fechaInicio);
          return fecha.getMonth() === mesActual && fecha.getFullYear() === añoActual;
        }) : [];
        this.gastosMes = reservasMes.length * 10;

        // 2. Calcular membresía activa
        this.calcularMembresiaActiva(reservas);

        // 3. Cargar vehículos
        this.cargarVehiculos();

        this.cargando = false;
        this.cdr.detectChanges();
        console.log('✅ Dashboard actualizado');
      },
      error: (error) => {
        console.error('❌ Error cargando reservas:', error);
        this.errorMensaje = 'Error al cargar tus reservas';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  calcularMembresiaActiva(reservas: Reserva[]): void {
    if (!reservas) {
      this.membresiaActiva = 'Sin membresía activa';
      this.venceMembresia = 0;
      return;
    }

    const ahora = new Date();
    // Buscar reservas de planes MENSUAL o ANUAL, con estado CONFIRMADA o ACTIVA, y fecha fin futura
    const membresias = reservas.filter(r =>
      (r.nombrePlan === 'MENSUAL' || r.nombrePlan === 'ANUAL') &&
      (r.estado === 'CONFIRMADA' || r.estado === 'ACTIVA') &&
      new Date(r.fechaFin) >= ahora
    );

    if (membresias.length > 0) {
      // Tomar la más reciente
      const activa = membresias.sort((a, b) =>
        new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime()
      )[0];
      this.membresiaActiva = activa.nombrePlan === 'MENSUAL' ? 'Plan Mensual' : 'Plan Anual';
      const diffTime = new Date(activa.fechaFin).getTime() - ahora.getTime();
      this.venceMembresia = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    } else {
      this.membresiaActiva = 'Sin membresía activa';
      this.venceMembresia = 0;
    }
  }

  cargarVehiculos(): void {
    if (!this.usuario?.id) return;
    this.vehiculoService.listarPorUsuario(this.usuario.id).subscribe({
      next: (vehiculos) => {
        this.vehiculos = vehiculos || [];
        console.log('🚗 Vehículos cargados:', this.vehiculos);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.warn('Error al cargar vehículos:', error);
        this.vehiculos = [];
        this.cdr.detectChanges();
      }
    });
  }

  get fechaActual(): string {
    const hoy = new Date();
    const opciones: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return hoy.toLocaleDateString('es-ES', opciones);
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    const d = new Date(fecha);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  }

  formatearHora(fecha: string): string {
    if (!fecha) return '';
    const d = new Date(fecha);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }

  getBadgeClass(estado: string): string {
    const mapa: Record<string, string> = {
      'ACTIVA': 'badge-available',
      'CONFIRMADA': 'badge-available',
      'PENDIENTE': 'badge-reserved',
      'FINALIZADA': 'badge-neutral',
      'CANCELADA': 'badge-occupied',
      'EXCEDIDA': 'badge-occupied'
    };
    return mapa[estado] || 'badge-neutral';
  }

  getBadgeText(estado: string): string {
    const mapa: Record<string, string> = {
      'ACTIVA': 'En curso',
      'CONFIRMADA': 'Confirmada',
      'PENDIENTE': 'Pendiente',
      'FINALIZADA': 'Finalizada',
      'CANCELADA': 'Cancelada',
      'EXCEDIDA': 'Excedida'
    };
    return mapa[estado] || estado;
  }

  get iniciales(): string {
    if (!this.usuario) return 'U';
    return `${this.usuario.nombres.charAt(0)}${this.usuario.apellidos.charAt(0)}`;
  }
}