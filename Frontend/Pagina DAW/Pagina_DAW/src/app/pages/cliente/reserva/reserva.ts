import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom, timeout } from 'rxjs';
import { ReservaService } from '../../../servicios/reserva.service';
import { EspacioService } from '../../../servicios/espacio.service';
import { PlanService } from '../../../servicios/plan.service';
import { VehiculoService } from '../../../servicios/vehiculo.service';
import { Espacio } from '../../../modelos/espacio';
import { Plan } from '../../../modelos/plan';
import { Vehiculo } from '../../../modelos/vehiculo';
import { Usuario } from '../../../modelos/usuario';
import { ReservaRegistro } from '../../../modelos/reserva-registro';

@Component({
  selector: 'app-reserva',
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './reserva.html',
  styleUrl: './reserva.css',
})
export class ReservaComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private espacioService = inject(EspacioService);
  private planService = inject(PlanService);
  private vehiculoService = inject(VehiculoService);
  private reservaService = inject(ReservaService);
  private platformId = inject(PLATFORM_ID);

  espacioId: number = 0;
  planId: number = 0;
  planNombre: string = '';
  vehiculoId: number = 0;
  vehiculoPlaca: string = '';

  espacio: Espacio | null = { id: 0, codigo: '---', tipo: 'REGULAR' } as Espacio;
  plan: Plan | null = { id: 0, nombre: 'POR_HORA', precioBase: 5 } as Plan;
  vehiculo: Vehiculo | null = { id: 0, placa: '---' } as Vehiculo;
  usuario: Usuario | null = null;

  fecha: string = '';
  horaInicio: string = '';
  horaFin: string = '';
  observacion: string = '';

  cargando: boolean = true;
  procesando: boolean = false;
  errorMensaje: string = '';
  totalEstimado: number = 0;
  precioPorHora: number = 5.00;
  mostrarHoras: boolean = true;

  // ✅ Limpia el mensaje y navega al mapa
  volverAlMapa(): void {
    this.errorMensaje = '';
    this.procesando = false;
    this.router.navigate(['/cliente/mapa', this.espacioId]);
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const usuarioGuardado = localStorage.getItem('usuario');
        if (usuarioGuardado) {
          this.usuario = JSON.parse(usuarioGuardado);
        }
      } catch {
        this.usuario = null;
      }
    }

    this.route.queryParams.subscribe(params => {
      this.espacioId = Number(params['espacioId']) || 0;
      this.planId = Number(params['planId']) || 0;
      this.planNombre = params['planNombre'] || 'POR_HORA';
      this.vehiculoId = Number(params['vehiculoId']) || 0;
      this.vehiculoPlaca = params['vehiculoPlaca'] || '---';

      if (!this.espacioId || !this.planId || !this.vehiculoId) {
        this.router.navigate(['/cliente/buscar']);
        return;
      }

      this.cargarDatos();
    });
  }

  async cargarDatos(): Promise<void> {
    this.cargando = false;
    this.cargarEspacio();
    this.cargarPlan();
    this.cargarVehiculo();
  }

  private async cargarEspacio(): Promise<void> {
    try {
      const espacio = await firstValueFrom(
        this.espacioService.buscarPorId(this.espacioId).pipe(timeout(5000))
      );
      if (espacio) this.espacio = espacio;
    } catch (e) {
      console.warn('No se pudo cargar el espacio:', e);
    }
  }

  private async cargarPlan(): Promise<void> {
    try {
      const plan = await firstValueFrom(
        this.planService.buscarPorId(this.planId).pipe(timeout(5000))
      );
      if (plan) {
        this.plan = plan;
        this.mostrarHoras = (plan.nombre === 'POR_HORA');
        await this.cargarPrecioPorHora();
      }
    } catch (e) {
      console.warn('No se pudo cargar el plan:', e);
      this.plan = {
        id: this.planId,
        nombre: this.planNombre || 'POR_HORA',
        precioBase: 5.00,
        descuentoPorcentaje: 0,
        precioFinal: 5.00,
      } as Plan;
      this.precioPorHora = 5.00;
      this.mostrarHoras = (this.planNombre === 'POR_HORA');
    }
  }

  private async cargarPrecioPorHora(): Promise<void> {
    try {
      const planes = await firstValueFrom(this.planService.listar().pipe(timeout(5000)));
      const planHora = planes.find(p => p.nombre === 'POR_HORA');
      if (planHora) {
        this.precioPorHora = planHora.precioBase;
      } else {
        this.precioPorHora = 5.00;
      }
    } catch (e) {
      console.warn('No se pudo obtener el precio por hora, usando default 5.00');
      this.precioPorHora = 5.00;
    }
  }

  private async cargarVehiculo(): Promise<void> {
    if (!this.vehiculoId) return;
    try {
      const vehiculo = await firstValueFrom(
        this.vehiculoService.buscarPorId(this.vehiculoId).pipe(timeout(5000))
      );
      if (vehiculo) {
        this.vehiculo = vehiculo;
        this.vehiculoPlaca = vehiculo.placa || '---';
      }
    } catch (e) {
      console.warn('No se pudo cargar el vehículo:', e);
    }
  }

  calcularTotal(): void {
    const planNombre = this.plan?.nombre || this.planNombre || 'POR_HORA';
    this.mostrarHoras = (planNombre === 'POR_HORA');

    if (planNombre === 'POR_HORA') {
      if (this.horaInicio && this.horaFin) {
        const [h1, m1] = this.horaInicio.split(':').map(Number);
        const [h2, m2] = this.horaFin.split(':').map(Number);
        const inicio = new Date(0, 0, 0, h1, m1);
        const fin = new Date(0, 0, 0, h2, m2);
        const diffMs = fin.getTime() - inicio.getTime();
        if (diffMs > 0) {
          const horas = diffMs / (1000 * 60 * 60);
          this.totalEstimado = horas * this.precioPorHora;
        } else {
          this.totalEstimado = 0;
        }
      } else {
        this.totalEstimado = 0;
      }
    } else if (planNombre === 'MENSUAL') {
      this.totalEstimado = this.precioPorHora * 30;
    } else if (planNombre === 'ANUAL') {
      this.totalEstimado = this.precioPorHora * 365 * 0.75;
    }
  }

  async confirmarReserva(): Promise<void> {
    if (this.procesando) return;

    const planNombre = this.plan?.nombre || this.planNombre || 'POR_HORA';

    if (!this.fecha) {
      this.errorMensaje = 'Selecciona una fecha.';
      setTimeout(() => this.errorMensaje = '', 5000);
      return;
    }

    const fechaSeleccionada = new Date(`${this.fecha}T00:00:00`);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (fechaSeleccionada < hoy) {
      this.errorMensaje = '⚠️ No puedes reservar en una fecha pasada.';
      setTimeout(() => this.errorMensaje = '', 5000);
      return;
    }

    if (planNombre === 'POR_HORA') {
      if (!this.horaInicio || !this.horaFin) {
        this.errorMensaje = 'Completa el horario de ingreso y salida.';
        setTimeout(() => this.errorMensaje = '', 5000);
        return;
      }
      if (this.totalEstimado <= 0) {
        this.errorMensaje = 'Horario no válido (la salida debe ser después del ingreso).';
        setTimeout(() => this.errorMensaje = '', 5000);
        return;
      }
    } else {
      this.horaInicio = '00:00';
      this.horaFin = '23:59';
    }

    if (!this.usuario) {
      this.errorMensaje = 'Inicia sesión para reservar.';
      setTimeout(() => this.errorMensaje = '', 5000);
      return;
    }

    this.procesando = true;
    this.errorMensaje = '';

    try {
      let fechaInicio: string;
      let fechaFin: string;

      if (planNombre === 'POR_HORA') {
        fechaInicio = `${this.fecha}T${this.horaInicio}:00`;
        fechaFin = `${this.fecha}T${this.horaFin}:00`;
      } else if (planNombre === 'MENSUAL') {
        const inicio = new Date(this.fecha);
        const fin = new Date(inicio);
        fin.setDate(fin.getDate() + 30);
        fechaInicio = inicio.toISOString().split('T')[0] + 'T00:00:00';
        fechaFin = fin.toISOString().split('T')[0] + 'T23:59:59';
      } else {
        const inicio = new Date(this.fecha);
        const fin = new Date(inicio);
        fin.setFullYear(fin.getFullYear() + 1);
        fechaInicio = inicio.toISOString().split('T')[0] + 'T00:00:00';
        fechaFin = fin.toISOString().split('T')[0] + 'T23:59:59';
      }

      const reservaData: ReservaRegistro = {
        usuarioId: this.usuario.id,
        espacioId: this.espacioId,
        planId: this.planId,
        vehiculoId: this.vehiculoId,
        fechaInicio: fechaInicio,
        fechaFin: fechaFin,
      };

      console.log('📤 Enviando reserva:', reservaData);

      const respuesta = await firstValueFrom(
        this.reservaService.registrar(reservaData).pipe(timeout(10000))
      );

      if (respuesta?.id) {
        this.router.navigate(['/cliente/pago'], {
          queryParams: {
            reservaId: respuesta.id,
            total: this.totalEstimado.toFixed(2),
            espacioId: this.espacioId,
            planId: this.planId,
            vehiculoId: this.vehiculoId,
          },
        });
      } else {
        this.errorMensaje = 'Error al crear la reserva.';
      }
    } catch (error: any) {
      console.error('❌ Error al confirmar reserva:', error);

      // ✅ DESACTIVAR BOTÓN INMEDIATAMENTE
      this.procesando = false;

      let mensaje = 'Error desconocido al crear la reserva.';
      if (error.error) {
        if (typeof error.error === 'object' && error.error.message) {
          mensaje = error.error.message;
        } else if (typeof error.error === 'string') {
          mensaje = error.error;
        }
      } else if (error.message) {
        mensaje = error.message;
      }

      console.log('📩 Mensaje de error:', mensaje);

      // ✅ ASIGNAR MENSAJE (PERMANENTE)
      if (error.status === 400) {
        if (mensaje.toLowerCase().includes('disponible') || 
            mensaje.toLowerCase().includes('ocupado') || 
            mensaje.toLowerCase().includes('reservado')) {
          this.errorMensaje = '⚠️ El espacio seleccionado no está disponible en el rango de fechas elegido. Por favor, elige otro espacio o cambia las fechas.';
        } else {
          this.errorMensaje = mensaje || 'Datos inválidos para la reserva.';
        }
      } else if (error.status === 0) {
        this.errorMensaje = '⚠️ No se pudo conectar con el servidor. Verifica tu conexión.';
      } else {
        this.errorMensaje = mensaje || 'Error al crear la reserva.';
      }

      // ✅ EL MENSAJE SE MUESTRA Y NO SE BORRA AUTOMÁTICAMENTE
      // (el usuario debe hacer clic en "Volver al mapa" para limpiarlo)
    } finally {
      // ✅ Asegurar que el botón se desactive siempre
      this.procesando = false;
    }
  }
}