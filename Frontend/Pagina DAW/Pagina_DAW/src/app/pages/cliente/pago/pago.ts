import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom, timeout } from 'rxjs';

// Servicios
import { ReservaService } from '../../../servicios/reserva.service';
import { EspacioService } from '../../../servicios/espacio.service';
import { PlanService } from '../../../servicios/plan.service';
import { VehiculoService } from '../../../servicios/vehiculo.service';

// Modelos
import { Reserva } from '../../../modelos/reserva';
import { Espacio } from '../../../modelos/espacio';
import { Plan } from '../../../modelos/plan';
import { Vehiculo } from '../../../modelos/vehiculo';
import { Usuario } from '../../../modelos/usuario';

@Component({
  selector: 'app-pago',
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './pago.html',
  styleUrl: './pago.css',
})
export class Pago implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private reservaService = inject(ReservaService);
  private espacioService = inject(EspacioService);
  private planService = inject(PlanService);
  private vehiculoService = inject(VehiculoService);
  private platformId = inject(PLATFORM_ID);

  // Datos de la URL
  reservaId: number = 0;
  total: number = 0;
  espacioId: number = 0;
  planId: number = 0;
  vehiculoId: number = 0;

  // Datos cargados (con valores por defecto)
  reserva: Reserva | null = { id: 0 } as Reserva;
  espacio: Espacio | null = { id: 0, codigo: '---' } as Espacio;
  plan: Plan | null = { id: 0, nombre: 'POR_HORA', precioBase: 5 } as Plan;
  vehiculo: Vehiculo | null = { id: 0, placa: '---' } as Vehiculo;
  usuario: Usuario | null = null;

  // Formulario
  nombreCompleto: string = '';
  email: string = '';
  metodoPago: string = 'TARJETA';
  aceptaTerminos: boolean = false;

  // Estado
  cargando: boolean = true;
  procesando: boolean = false;
  errorMensaje: string = '';
  mensajeExito: string = '';

  // Modal Tarjeta
  mostrarModalTarjeta: boolean = false;
  tarjetaNumero: string = '';
  tarjetaFecha: string = '';
  tarjetaCvv: string = '';

  // Modal Yape
  mostrarModalYape: boolean = false;
  yapeCelular: string = '';
  yapeClave: string = '';

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const usuarioGuardado = localStorage.getItem('usuario');
        if (usuarioGuardado) {
          this.usuario = JSON.parse(usuarioGuardado);
          if (this.usuario) {
            this.nombreCompleto = `${this.usuario.nombres} ${this.usuario.apellidos}`;
            this.email = this.usuario.email || '';
          }
        }
      } catch {
        this.usuario = null;
      }
    }

    this.route.queryParams.subscribe(params => {
      this.reservaId = Number(params['reservaId']) || 0;
      this.total = Number(params['total']) || 0;
      this.espacioId = Number(params['espacioId']) || 0;
      this.planId = Number(params['planId']) || 0;
      this.vehiculoId = Number(params['vehiculoId']) || 0;

      if (!this.reservaId) {
        this.router.navigate(['/cliente/buscar']);
        return;
      }

      this.cargarDatos();
    });
  }

  async cargarDatos(): Promise<void> {
    this.cargando = true;
    this.errorMensaje = '';
    this.cargando = false;

    this.cargarReserva();
    if (this.espacioId) this.cargarEspacio();
    if (this.planId) this.cargarPlan();
    if (this.vehiculoId) this.cargarVehiculo();
  }

  private async cargarReserva(): Promise<void> {
    try {
      const reserva = await this.reservaService.buscarPorId(this.reservaId).toPromise();
      if (reserva) this.reserva = reserva;
    } catch (e) {
      console.warn('No se pudo cargar la reserva:', e);
    }
  }

  private async cargarEspacio(): Promise<void> {
    try {
      const espacio = await this.espacioService.buscarPorId(this.espacioId).toPromise();
      if (espacio) this.espacio = espacio;
    } catch (e) {
      console.warn('No se pudo cargar el espacio:', e);
    }
  }

  private async cargarPlan(): Promise<void> {
    try {
      const plan = await this.planService.buscarPorId(this.planId).toPromise();
      if (plan) this.plan = plan;
    } catch (e) {
      console.warn('No se pudo cargar el plan:', e);
    }
  }

  private async cargarVehiculo(): Promise<void> {
    try {
      const vehiculo = await this.vehiculoService.buscarPorId(this.vehiculoId).toPromise();
      if (vehiculo) this.vehiculo = vehiculo;
    } catch (e) {
      console.warn('No se pudo cargar el vehículo:', e);
    }
  }

  seleccionarMetodo(metodo: string): void {
    this.metodoPago = metodo;
  }

  abrirModalPago(): void {
    if (!this.aceptaTerminos) {
      this.errorMensaje = 'Debes aceptar los términos y condiciones.';
      setTimeout(() => this.errorMensaje = '', 5000);
      return;
    }
    if (!this.nombreCompleto || !this.email) {
      this.errorMensaje = 'Completa tu nombre y correo electrónico.';
      setTimeout(() => this.errorMensaje = '', 5000);
      return;
    }

    if (this.metodoPago === 'TARJETA') {
      this.mostrarModalTarjeta = true;
      this.tarjetaNumero = '';
      this.tarjetaFecha = '';
      this.tarjetaCvv = '';
    } else if (this.metodoPago === 'YAPE') {
      this.mostrarModalYape = true;
      this.yapeCelular = '';
      this.yapeClave = '';
    } else {
      // EFECTIVO
      if (confirm(`¿Confirmas el pago en efectivo de S/ ${(this.total + 1).toFixed(2)} en sede?`)) {
        this.simularPago();
      }
    }
  }

  confirmarPagoTarjeta(): void {
    if (!this.tarjetaNumero || this.tarjetaNumero.length < 16) {
      this.errorMensaje = 'Ingresa un número de tarjeta válido (16 dígitos).';
      setTimeout(() => this.errorMensaje = '', 5000);
      return;
    }
    if (!this.tarjetaFecha || !this.tarjetaCvv || this.tarjetaCvv.length < 3) {
      this.errorMensaje = 'Completa fecha y CVV.';
      setTimeout(() => this.errorMensaje = '', 5000);
      return;
    }
    this.mostrarModalTarjeta = false;
    this.simularPago();
  }

  confirmarPagoYape(): void {
    if (!this.yapeCelular || this.yapeCelular.length < 9) {
      this.errorMensaje = 'Ingresa un número de celular válido (9 dígitos).';
      setTimeout(() => this.errorMensaje = '', 5000);
      return;
    }
    if (!this.yapeClave || this.yapeClave.length !== 4) {
      this.errorMensaje = 'Ingresa tu clave de 4 dígitos.';
      setTimeout(() => this.errorMensaje = '', 5000);
      return;
    }
    this.mostrarModalYape = false;
    this.simularPago();
  }

  // ✅ MÉTODO CORREGIDO: CONFIRMA LA RESERVA EN EL BACKEND
  async simularPago(): Promise<void> {
    this.procesando = true;
    this.errorMensaje = '';
    this.mensajeExito = '';

    try {
      // Simular procesamiento
      await new Promise(resolve => setTimeout(resolve, 1500));

      // ✅ CONFIRMAR RESERVA EN EL BACKEND
      await firstValueFrom(
        this.reservaService.confirmar(this.reservaId, this.total + 1)
      );

      this.mensajeExito = '✅ Pago realizado con éxito.';
      setTimeout(() => {
        this.router.navigate(['/cliente/ticket'], {
          queryParams: {
            reservaId: this.reservaId,
            total: this.total + 1,
            metodo: this.metodoPago,
          },
        });
      }, 500);
    } catch (error: any) {
      console.error('Error al procesar pago:', error);
      let mensaje = 'Error al procesar el pago. Intenta nuevamente.';
      if (error.status === 400) {
        mensaje = error?.error?.message || 'La reserva ya fue confirmada o tiene un error.';
      } else if (error.status === 0) {
        mensaje = '⚠️ No se pudo conectar con el servidor. Verifica tu conexión.';
      }
      this.errorMensaje = mensaje;
      setTimeout(() => this.errorMensaje = '', 5000);
    } finally {
      this.procesando = false;
    }
  }

  getNombrePlan(nombre: string): string {
    const mapa: Record<string, string> = {
      POR_HORA: 'Por hora',
      MENSUAL: 'Mensual',
      ANUAL: 'Anual',
    };
    return mapa[nombre] || nombre;
  }

  getTipoEspacio(tipo: string): string {
    const mapa: Record<string, string> = {
      REGULAR: 'Regular',
      DISCAPACITADO: 'Discapacitado',
      MOTO: 'Moto',
    };
    return mapa[tipo] || tipo;
  }
}