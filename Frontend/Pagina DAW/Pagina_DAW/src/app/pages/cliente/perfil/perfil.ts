import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef, NgZone, ApplicationRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { UsuarioService } from '../../../servicios/usuario.service';
import { VehiculoService } from '../../../servicios/vehiculo.service';
import { Usuario } from '../../../modelos/usuario';
import { Vehiculo } from '../../../modelos/vehiculo';

@Component({
  selector: 'app-perfil',
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil implements OnInit {
  private usuarioService = inject(UsuarioService);
  private vehiculoService = inject(VehiculoService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private appRef = inject(ApplicationRef);

  usuario: Usuario | null = null;
  vehiculos: Vehiculo[] = [];
  cargando: boolean = true;
  errorMensaje: string = '';
  forceUpdate: number = 0;

  // Modal Editar Perfil
  editModalVisible: boolean = false;
  editNombres: string = '';
  editApellidos: string = '';
  editEmail: string = '';
  editCelular: string = '';
  editConadisVerificado: boolean = false;
  editConadisImagenUrl: string = '';
  editCargando: boolean = false;

  // Modal Cambiar Contraseña
  passModalVisible: boolean = false;
  passActual: string = '';
  passNueva: string = '';
  passConfirmar: string = '';
  passCargando: boolean = false;
  passError: string = '';

  ngOnInit(): void {
    this.cargarUsuario();
  }

  cargarUsuario(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const usuarioGuardado = localStorage.getItem('usuario');
      if (usuarioGuardado) {
        this.usuario = JSON.parse(usuarioGuardado);
        console.log('✅ Usuario cargado en Perfil:', this.usuario);
        if (this.usuario?.id) {
          this.cargarVehiculos();
        } else {
          this.cargando = false;
          this.errorMensaje = 'Inicia sesión para ver tu perfil.';
          this.cdr.detectChanges();
          this.appRef.tick();
        }
      } else {
        this.cargando = false;
        this.errorMensaje = 'Inicia sesión para ver tu perfil.';
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

  async cargarVehiculos(): Promise<void> {
    if (!this.usuario?.id) return;
    try {
      const vehiculos = await firstValueFrom(
        this.vehiculoService.listarPorUsuario(this.usuario.id)
      );
      this.vehiculos = vehiculos || [];
      console.log('🚗 Vehículos cargados:', this.vehiculos);
    } catch (error) {
      console.error('Error al cargar vehículos:', error);
      this.errorMensaje = 'Error al cargar tus vehículos.';
    } finally {
      this.cargando = false;
      this.forceUpdate++;
      this.cdr.detectChanges();
      this.appRef.tick();
    }
  }

  // ============================================================
  // CERRAR SESIÓN
  // ============================================================
  cerrarSesion(): void {
    if (confirm('¿Estás seguro de cerrar sesión?')) {
      localStorage.removeItem('usuario');
      this.router.navigate(['/landing']);
    }
  }

  // ============================================================
  // EDITAR PERFIL (MODAL) - CON CONADIS
  // ============================================================
  abrirEditarPerfil(): void {
    if (!this.usuario) return;
    this.editNombres = this.usuario.nombres || '';
    this.editApellidos = this.usuario.apellidos || '';
    this.editEmail = this.usuario.email || '';
    this.editCelular = this.usuario.celular || '';
    this.editConadisVerificado = this.usuario.conadisVerificado || false;
    this.editConadisImagenUrl = this.usuario.conadisImagenUrl || '';
    this.editModalVisible = true;
    this.editCargando = false;
    this.errorMensaje = '';
  }

  cerrarEditarPerfil(): void {
    this.editModalVisible = false;
  }

  async guardarEditarPerfil(): Promise<void> {
    if (!this.usuario?.id) return;
    if (!this.editNombres || !this.editApellidos || !this.editEmail) {
      this.errorMensaje = 'Nombres, apellidos y email son obligatorios.';
      setTimeout(() => this.errorMensaje = '', 4000);
      return;
    }
    this.editCargando = true;
    this.errorMensaje = '';

    try {
      // ✅ CORREGIDO: no enviamos null, usamos undefined
      const usuarioActualizado: Usuario = {
        ...this.usuario,
        nombres: this.editNombres,
        apellidos: this.editApellidos,
        email: this.editEmail,
        celular: this.editCelular,
        conadisVerificado: this.editConadisVerificado,
        conadisImagenUrl: this.editConadisImagenUrl || undefined,
      };
      const respuesta = await firstValueFrom(
        this.usuarioService.actualizar(this.usuario.id, usuarioActualizado)
      );
      this.usuario = respuesta;
      localStorage.setItem('usuario', JSON.stringify(respuesta));
      this.editModalVisible = false;
      this.errorMensaje = '';
      this.cargarVehiculos();
    } catch (error: any) {
      console.error('Error al actualizar perfil:', error);
      this.errorMensaje = error?.error?.message || 'Error al actualizar el perfil.';
      setTimeout(() => this.errorMensaje = '', 4000);
    } finally {
      this.editCargando = false;
      this.cdr.detectChanges();
      this.appRef.tick();
    }
  }

  // ============================================================
  // CAMBIAR CONTRASEÑA (MODAL)
  // ============================================================
  abrirCambiarContrasena(): void {
    this.passModalVisible = true;
    this.passActual = '';
    this.passNueva = '';
    this.passConfirmar = '';
    this.passError = '';
    this.passCargando = false;
    this.errorMensaje = '';
  }

  cerrarCambiarContrasena(): void {
    this.passModalVisible = false;
  }

  async guardarCambiarContrasena(): Promise<void> {
    if (!this.usuario?.id) return;
    if (!this.passActual || !this.passNueva || !this.passConfirmar) {
      this.passError = 'Todos los campos son obligatorios.';
      setTimeout(() => this.passError = '', 4000);
      return;
    }
    if (this.passNueva.length < 8) {
      this.passError = 'La nueva contraseña debe tener al menos 8 caracteres.';
      setTimeout(() => this.passError = '', 4000);
      return;
    }
    if (this.passNueva !== this.passConfirmar) {
      this.passError = 'Las contraseñas no coinciden.';
      setTimeout(() => this.passError = '', 4000);
      return;
    }

    this.passCargando = true;
    this.passError = '';
    this.errorMensaje = '';

    try {
      const usuarioActualizado: Usuario = {
        ...this.usuario,
        password: this.passNueva,
      };
      const respuesta = await firstValueFrom(
        this.usuarioService.actualizar(this.usuario.id, usuarioActualizado)
      );
      this.usuario = respuesta;
      localStorage.setItem('usuario', JSON.stringify(respuesta));
      this.passModalVisible = false;
      this.errorMensaje = '';
    } catch (error: any) {
      console.error('Error al cambiar contraseña:', error);
      this.passError = error?.error?.message || 'Error al cambiar la contraseña.';
      setTimeout(() => this.passError = '', 4000);
    } finally {
      this.passCargando = false;
      this.cdr.detectChanges();
      this.appRef.tick();
    }
  }

  // ============================================================
  // VEHÍCULOS (redirigir a movil)
  // ============================================================
  agregarVehiculo(): void {
    this.router.navigate(['/cliente/movil']);
  }

  editarVehiculo(vehiculo: Vehiculo): void {
    this.router.navigate(['/cliente/movil'], {
      queryParams: { vehiculoId: vehiculo.id }
    });
  }

  // ============================================================
  // UTILIDADES
  // ============================================================
  getIconoVehiculo(tipo: string): string {
    return tipo === 'MOTO' ? '🏍️' : '🚗';
  }

  getEstadoConadis(): string {
    if (!this.usuario) return 'No registrado';
    return this.usuario.conadisVerificado ? '✅ Verificado' : '❌ No verificado';
  }

  trackById(index: number, item: Vehiculo): number {
    return item.id;
  }
}