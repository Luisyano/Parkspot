import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef, NgZone, ApplicationRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom, timeout } from 'rxjs';
import { VehiculoService } from '../../../servicios/vehiculo.service';
import { Vehiculo } from '../../../modelos/vehiculo';
import { Usuario } from '../../../modelos/usuario';

@Component({
  selector: 'app-movil',
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './movil.html',
  styleUrl: './movil.css',
})
export class Movil implements OnInit {
  private vehiculoService = inject(VehiculoService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private appRef = inject(ApplicationRef);

  usuario: Usuario | null = null;
  vehiculos: Vehiculo[] = [];

  formularioVisible: boolean = false;
  vehiculoEditando: Vehiculo | null = null;

  formPlaca: string = '';
  formModelo: string = '';
  formTipo: 'AUTO' | 'MOTO' = 'AUTO';

  cargando: boolean = true;
  procesando: boolean = false;
  errorMensaje: string = '';
  mensajeExito: string = '';

  // ✅ Variable de "fuerza bruta" para forzar actualización
  forceUpdate: number = 0;

  get tieneLimiteAlcanzado(): boolean {
    return this.vehiculos.length >= 5;
  }

  // ✅ trackBy para el *ngFor
  trackByVehiculo(index: number, vehiculo: Vehiculo): number {
    return vehiculo.id;
  }

  ngOnInit(): void {
    // ✅ Ejecutar fuera de Angular para evitar conflictos de hidratación
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        this.ngZone.run(() => {
          this.cargarUsuario();
        });
      }, 0);
    });
  }

  // ============================================================
  // CARGA DE DATOS
  // ============================================================
  async cargarUsuario(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      this.cargando = false;
      this.cdr.detectChanges();
      this.appRef.tick();
      return;
    }
    try {
      const usuarioGuardado = localStorage.getItem('usuario');
      if (usuarioGuardado) {
        this.usuario = JSON.parse(usuarioGuardado);
        if (this.usuario) {
          await this.cargarVehiculos();
        } else {
          this.cargando = false;
          this.cdr.detectChanges();
          this.appRef.tick();
        }
      } else {
        this.cargando = false;
        this.cdr.detectChanges();
        this.appRef.tick();
      }
    } catch (error) {
      console.error('Error al cargar usuario:', error);
      this.errorMensaje = 'No se pudo cargar la información del usuario.';
      this.cargando = false;
      this.ngZone.run(() => {
        this.cdr.detectChanges();
        this.appRef.tick();
      });
    }
  }

  async cargarVehiculos(): Promise<void> {
    if (!this.usuario) {
      this.cargando = false;
      return;
    }
    this.cargando = true;
    this.errorMensaje = '';
    this.cdr.detectChanges();

    try {
      const vehiculos = await firstValueFrom(
        this.vehiculoService.listarPorUsuario(this.usuario.id)
      );
      this.vehiculos = vehiculos;
      console.log('✅ Vehículos cargados:', this.vehiculos);

      // ✅ Forzar actualización después de cargar datos
      this.ngZone.run(() => {
        setTimeout(() => {
          this.cargando = false;
          this.forceUpdate++;
          this.cdr.detectChanges();
          this.appRef.tick();
          console.log('✅ Vista de vehículos actualizada');
        }, 0);
      });

    } catch (error) {
      console.error('Error cargando vehículos:', error);
      this.errorMensaje = 'Error al cargar tus vehículos.';
      this.vehiculos = [];
      this.cargando = false;
      this.ngZone.run(() => {
        setTimeout(() => {
          this.cdr.detectChanges();
          this.appRef.tick();
        }, 0);
      });
    }
  }

  // ============================================================
  // ACCIONES DEL FORMULARIO
  // ============================================================
  abrirAgregar(): void {
    if (this.tieneLimiteAlcanzado) {
      this.errorMensaje = '⚠️ Has alcanzado el límite máximo de 5 vehículos por cuenta.';
      setTimeout(() => this.errorMensaje = '', 5000);
      return;
    }
    this.formularioVisible = true;
    this.vehiculoEditando = null;
    this.formPlaca = '';
    this.formModelo = '';
    this.formTipo = 'AUTO';
    this.errorMensaje = '';
    this.mensajeExito = '';
    this.procesando = false;
    this.cdr.detectChanges();
  }

  editarVehiculo(vehiculo: Vehiculo): void {
    this.formularioVisible = true;
    this.vehiculoEditando = vehiculo;
    this.formPlaca = vehiculo.placa;
    this.formModelo = vehiculo.modelo;
    this.formTipo = vehiculo.tipo;
    this.errorMensaje = '';
    this.mensajeExito = '';
    this.procesando = false;
    this.cdr.detectChanges();
  }

  cancelarFormulario(): void {
    this.formularioVisible = false;
    this.vehiculoEditando = null;
    this.errorMensaje = '';
    this.mensajeExito = '';
    this.procesando = false;
    this.cdr.detectChanges();
  }

  // ============================================================
  // GUARDAR VEHÍCULO (CON TIMEOUT Y DETECCIÓN DE CAMBIOS)
  // ============================================================
  async guardarVehiculo(): Promise<void> {
    if (this.procesando) return;

    if (!this.usuario) {
      this.errorMensaje = 'Usuario no identificado. Inicia sesión nuevamente.';
      setTimeout(() => this.errorMensaje = '', 4000);
      return;
    }

    if (!this.formPlaca || !this.formModelo) {
      this.errorMensaje = 'La placa y el modelo son obligatorios.';
      setTimeout(() => this.errorMensaje = '', 4000);
      return;
    }

    if (this.formPlaca.length < 3) {
      this.errorMensaje = 'La placa debe tener al menos 3 caracteres.';
      setTimeout(() => this.errorMensaje = '', 4000);
      return;
    }

    if (!this.vehiculoEditando && this.tieneLimiteAlcanzado) {
      this.errorMensaje = '⚠️ Has alcanzado el límite máximo de 5 vehículos.';
      setTimeout(() => this.errorMensaje = '', 4000);
      return;
    }

    const placaNueva = this.formPlaca.toUpperCase().trim();
    const vehiculoData: Vehiculo = {
      id: 0,
      placa: placaNueva,
      modelo: this.formModelo.trim(),
      tipo: this.formTipo,
      usuarioId: this.usuario.id
    };

    this.errorMensaje = '';
    this.mensajeExito = '';
    this.procesando = true;
    this.cdr.detectChanges();

    try {
      let respuesta;
      if (this.vehiculoEditando) {
        respuesta = await firstValueFrom(
          this.vehiculoService.actualizar(this.vehiculoEditando.id, vehiculoData)
            .pipe(timeout(8000))
        );
        console.log('✅ Actualizado:', respuesta);
        this.mensajeExito = '✅ Vehículo actualizado correctamente.';
      } else {
        respuesta = await firstValueFrom(
          this.vehiculoService.registrar(vehiculoData)
            .pipe(timeout(8000))
        );
        console.log('✅ Registrado:', respuesta);
        this.mensajeExito = '✅ Vehículo agregado correctamente.';
      }

      this.cancelarFormulario();
      await this.cargarVehiculos();

      // ✅ Forzar actualización después de guardar
      this.ngZone.run(() => {
        setTimeout(() => {
          this.cdr.detectChanges();
          this.appRef.tick();
        }, 0);
      });

    } catch (error: any) {
      console.error('❌ Error en operación:', error);

      if (error.name === 'TimeoutError') {
        this.errorMensaje = '⚠️ El servidor tardó demasiado. Verifica si el vehículo se guardó.';
      } else if (error.status === 400) {
        const mensaje = error.error?.message || '';
        if (mensaje.toLowerCase().includes('placa') || mensaje.toLowerCase().includes('duplicate')) {
          this.errorMensaje = `⚠️ La placa ${placaNueva} ya está registrada. Usa otra.`;
        } else {
          this.errorMensaje = mensaje || 'Error al guardar el vehículo. Verifica los datos.';
        }
      } else if (error.status === 0) {
        this.errorMensaje = 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo.';
      } else {
        this.errorMensaje = error.error?.message || 'Error al guardar el vehículo.';
      }
      setTimeout(() => this.errorMensaje = '', 5000);
      this.procesando = false;
      this.cdr.detectChanges();
    } finally {
      this.procesando = false;
      console.log('🔓 procesando liberado');
    }
  }

  // ============================================================
  // ELIMINAR VEHÍCULO (CON ACTUALIZACIÓN OPTIMISTA Y TIMEOUT)
  // ============================================================
  async eliminarVehiculo(id: number, placa: string): Promise<void> {
    if (!confirm(`¿Estás seguro de eliminar el vehículo ${placa}?`)) return;

    // ✅ Actualización optimista: lo quitamos de la vista AHORA
    const respaldo = [...this.vehiculos];
    this.vehiculos = this.vehiculos.filter(v => v.id !== id);
    this.cdr.detectChanges();

    try {
      await firstValueFrom(
        this.vehiculoService.eliminar(id).pipe(timeout(8000))
      );
      this.mensajeExito = `✅ Vehículo ${placa} eliminado.`;
      setTimeout(() => this.mensajeExito = '', 4000);
      this.cdr.detectChanges();
    } catch (error: any) {
      // ❌ Si falla, RESTAURAMOS la lista
      this.vehiculos = respaldo;
      this.cdr.detectChanges();
      console.error('Error eliminando vehículo:', error);

      if (error.name === 'TimeoutError') {
        this.errorMensaje = '⚠️ El servidor tardó demasiado. Verifica si se eliminó.';
      } else if (error.status === 404) {
        this.mensajeExito = `🔄 El vehículo ${placa} ya no existe. Lista actualizada.`;
        await this.cargarVehiculos();
        setTimeout(() => this.mensajeExito = '', 4000);
        return;
      } else {
        this.errorMensaje = error.error?.message || 'Error al eliminar el vehículo.';
      }
      setTimeout(() => this.errorMensaje = '', 5000);
      this.cdr.detectChanges();
      this.appRef.tick();
    }
  }

  // ============================================================
  // MÉTODOS PARA LA VISTA
  // ============================================================
  getIconoVehiculo(tipo: string): string {
    return tipo === 'MOTO' ? '🏍️' : '🚗';
  }

  getClaseTipo(tipo: string): string {
    return tipo === 'MOTO' ? 'tipo-moto' : 'tipo-auto';
  }
}