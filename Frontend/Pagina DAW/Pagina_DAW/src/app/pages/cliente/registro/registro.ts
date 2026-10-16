import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UsuarioService } from '../../../servicios/usuario.service';
import { Usuario } from '../../../modelos/usuario';

@Component({
  selector: 'app-registro',
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './registro.html',
  styleUrl: './registro.css',
})
export class Registro {
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);

  // Datos del formulario
  nombres: string = '';
  apellidos: string = '';
  email: string = '';
  celular: string = '';
  password: string = '';
  confirmPassword: string = '';
  aceptaTerminos: boolean = false;

  errorMensaje: string = '';
  cargando: boolean = false;

  registrar(): void {
    // Limpiar error anterior
    this.errorMensaje = '';

    // ✅ Validaciones
    if (!this.nombres || !this.apellidos || !this.email || !this.celular || !this.password) {
      this.errorMensaje = 'Todos los campos son obligatorios';
      return;
    }

    if (this.password.length < 8) {
      this.errorMensaje = 'La contraseña debe tener al menos 8 caracteres';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMensaje = 'Las contraseñas no coinciden';
      return;
    }

    if (!this.aceptaTerminos) {
      this.errorMensaje = 'Debes aceptar los Términos y Condiciones';
      return;
    }

    this.cargando = true;
    this.errorMensaje = '';

    const usuario: Usuario = {
      id: 0,
      nombres: this.nombres,
      apellidos: this.apellidos,
      email: this.email,
      password: this.password,
      celular: this.celular,
      rol: 'CLIENTE',
      conadisVerificado: false,
      tieneTarjetaGuardada: false
    };

    console.log('📤 Enviando registro:', usuario);

    this.usuarioService.registrar(usuario).subscribe({
      next: (usuarioCreado) => {
        this.cargando = false;
        console.log('✅ Usuario creado:', usuarioCreado);
        // Guardar usuario en localStorage
        localStorage.setItem('usuario', JSON.stringify(usuarioCreado));
        this.router.navigate(['/cliente/dashboard']);
      },
      error: (error) => {
        this.cargando = false;
        console.error('❌ Error en registro:', error);
        
        // ✅ Manejo detallado de errores
        if (error.status === 0) {
          this.errorMensaje = '⚠️ No se pudo conectar con el servidor. Verifica que el backend esté corriendo en http://localhost:8090';
        } else if (error.status === 400) {
          const mensaje = error.error?.message || '';
          if (mensaje.includes('email') || mensaje.includes('duplicate')) {
            this.errorMensaje = '❌ El correo electrónico ya está registrado. Usa otro.';
          } else {
            this.errorMensaje = mensaje || '❌ Datos inválidos. Verifica tu información.';
          }
        } else if (error.status === 500) {
          this.errorMensaje = '❌ Error en el servidor. Intenta más tarde.';
        } else {
          this.errorMensaje = error.error?.message || '❌ Error al registrar. Intenta nuevamente.';
        }
      }
    });
  }
}