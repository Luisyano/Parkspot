import { Component, inject, PLATFORM_ID, ChangeDetectorRef, NgZone, ApplicationRef, afterNextRender } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { PlanService } from '../../../servicios/plan.service';
import { VehiculoService } from '../../../servicios/vehiculo.service';
import { Plan } from '../../../modelos/plan';
import { Vehiculo } from '../../../modelos/vehiculo';
import { Usuario } from '../../../modelos/usuario';

@Component({
  selector: 'app-plan',
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './plan.html',
  styleUrl: './plan.css',
})
export class PlanComponent {
  private planService = inject(PlanService);
  private vehiculoService = inject(VehiculoService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private appRef = inject(ApplicationRef);

  espacioId: number = 0;
  codigoEspacio: string = 'B4';
  nombreSede: string = 'ParkSpot San Isidro';
  piso: string = 'Piso 2';

  planes: Plan[] = [];
  planSeleccionado: Plan | null = null;
  vehiculos: Vehiculo[] = [];
  vehiculoSeleccionado: Vehiculo | null = null;
  usuario: Usuario | null = null;

  cargando: boolean = true;
  errorMensaje: string = '';

  // ✅ Variable de "fuerza bruta"
  forceUpdate: number = 0;

  constructor() {
    // ✅ afterNextRender es seguro para SSR
    afterNextRender(() => {
      if (isPlatformBrowser(this.platformId)) {
        this.cargarUsuario();
      }
    });
  }

  // ✅ trackBy para planes y vehículos
  trackByPlan(index: number, plan: Plan): number {
    return plan.id;
  }

  trackByVehiculo(index: number, vehiculo: Vehiculo): number {
    return vehiculo.id;
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.espacioId = Number(params['espacioId']) || 0;
      // ✅ Forzar carga después de obtener el espacioId
      this.ngZone.runOutsideAngular(() => {
        setTimeout(() => {
          this.ngZone.run(() => {
            this.cargarPlanes();
          });
        }, 0);
      });
    });
  }

  cargarUsuario(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const usuarioGuardado = localStorage.getItem('usuario');
      if (usuarioGuardado) {
        this.usuario = JSON.parse(usuarioGuardado);
        console.log('✅ Usuario cargado en Plan:', this.usuario);
        this.cargarVehiculos();
      } else {
        console.warn('⚠️ No hay usuario en localStorage');
        this.vehiculos = [];
        this.cdr.detectChanges();
        this.appRef.tick();
      }
    } catch (error) {
      console.error('Error al leer localStorage:', error);
      this.vehiculos = [];
      this.cdr.detectChanges();
      this.appRef.tick();
    }
  }

  cargarPlanes(): void {
    this.cargando = true;
    this.errorMensaje = '';
    this.cdr.detectChanges();

    this.planService.listar().subscribe({
      next: (planes) => {
        this.planes = planes;
        if (this.planes.length > 0) {
          this.planSeleccionado = this.planes[0];
        }
        // ✅ Forzar actualización
        this.ngZone.run(() => {
          setTimeout(() => {
            this.cargando = false;
            this.forceUpdate++;
            this.cdr.detectChanges();
            this.appRef.tick();
            console.log('✅ Planes cargados:', this.planes);
          }, 0);
        });
      },
      error: (err) => {
        console.warn('⚠️ Error cargando planes, usando datos de ejemplo:', err);
        // ✅ Datos de ejemplo con descuentos correctos
        this.planes = [
          { id: 1, nombre: 'POR_HORA', precioBase: 6.50, descuentoPorcentaje: 0, precioFinal: 6.50 },
          { id: 2, nombre: 'MENSUAL', precioBase: 150.00, descuentoPorcentaje: 20, precioFinal: 120.00 },
          { id: 3, nombre: 'ANUAL', precioBase: 1800.00, descuentoPorcentaje: 25, precioFinal: 1350.00 }
        ];
        if (this.planes.length > 0) {
          this.planSeleccionado = this.planes[0];
        }
        this.ngZone.run(() => {
          setTimeout(() => {
            this.cargando = false;
            this.forceUpdate++;
            this.cdr.detectChanges();
            this.appRef.tick();
          }, 0);
        });
      }
    });
  }

  cargarVehiculos(): void {
    if (!this.usuario) {
      this.vehiculos = [];
      this.cdr.detectChanges();
      this.appRef.tick();
      return;
    }

    this.vehiculoService.listarPorUsuario(this.usuario.id).subscribe({
      next: (vehiculos) => {
        this.vehiculos = vehiculos;
        if (this.vehiculos.length > 0) {
          this.vehiculoSeleccionado = this.vehiculos[0];
        }
        this.ngZone.run(() => {
          setTimeout(() => {
            this.cdr.detectChanges();
            this.appRef.tick();
            console.log('✅ Vehículos cargados:', this.vehiculos);
          }, 0);
        });
      },
      error: (err) => {
        console.warn('⚠️ Error cargando vehículos:', err);
        this.vehiculos = [];
        this.cdr.detectChanges();
        this.appRef.tick();
      }
    });
  }

  seleccionarPlan(plan: Plan): void {
    this.planSeleccionado = plan;
    // ✅ Forzar actualización visual
    this.cdr.detectChanges();
  }

  seleccionarVehiculo(vehiculo: Vehiculo): void {
    this.vehiculoSeleccionado = vehiculo;
    this.cdr.detectChanges();
  }

  confirmarSeleccion(): void {
    if (!this.planSeleccionado || !this.vehiculoSeleccionado) return;
    this.router.navigate(['/cliente/reserva'], {
      queryParams: {
        espacioId: this.espacioId,
        planId: this.planSeleccionado.id,
        planNombre: this.planSeleccionado.nombre,
        vehiculoId: this.vehiculoSeleccionado.id,
        vehiculoPlaca: this.vehiculoSeleccionado.placa
      }
    });
  }

  getNombrePlan(nombre: string): string {
    const mapa: Record<string, string> = {
      'POR_HORA': 'Por hora / día',
      'MENSUAL': 'Mensual',
      'ANUAL': 'Anual'
    };
    return mapa[nombre] || nombre;
  }

  getPrecioFinal(plan: Plan): string {
    return (plan.precioFinal || plan.precioBase).toFixed(2);
  }

  getPrecioBase(plan: Plan): string {
    return plan.precioBase.toFixed(2);
  }

  getIconoPlan(nombre: string): string {
    const mapa: Record<string, string> = {
      'POR_HORA': 'ti ti-clock-hour-4',
      'MENSUAL': 'ti ti-calendar-month',
      'ANUAL': 'ti ti-calendar-star'
    };
    return mapa[nombre] || 'ti ti-clock';
  }
}