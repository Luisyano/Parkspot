import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UsuarioService } from '../../../servicios/usuario.service';

@Component({
  selector: 'app-login',
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);

  email: string = '';
  password: string = '';
  recordarme: boolean = false;
  errorMensaje: string = '';
  cargando: boolean = false;

  iniciarSesion(): void {
    if (!this.email || !this.password) {
      this.errorMensaje = 'Por favor, completa todos los campos';
      return;
    }

    this.cargando = true;
    this.errorMensaje = '';

    this.usuarioService.buscarPorEmail(this.email).subscribe({
      next: (usuario) => {
        this.cargando = false;
        
        if (usuario && usuario.id) {
          // ✅ Guardar usuario en localStorage
          localStorage.setItem('usuario', JSON.stringify(usuario));
          console.log('✅ Usuario guardado en localStorage:', usuario);
          console.log('👤 Rol del usuario:', usuario.rol);
          
          // ✅ Redirigir según el rol
          this.redirigirPorRol(usuario.rol);
        } else {
          this.errorMensaje = 'Credenciales incorrectas';
        }
      },
      error: (error) => {
        this.cargando = false;
        console.error('Error en login:', error);
        
        // ⚠️ Fallback: Usuario de prueba para desarrollo
        // Admin de prueba
        if (this.email === 'admin@parkspot.pe' && this.password === '123456') {
          const adminPrueba = {
            id: 1,
            nombres: 'Admin',
            apellidos: 'ParkSpot',
            email: this.email,
            celular: '999999999',
            rol: 'ADMIN',
            conadisVerificado: false,
            tieneTarjetaGuardada: false
          };
          localStorage.setItem('usuario', JSON.stringify(adminPrueba));
          this.redirigirPorRol('ADMIN');
          return;
        }
        
        // Operador de prueba
        if (this.email === 'operador@test.com' && this.password === '123456') {
          const operadorPrueba = {
            id: 2,
            nombres: 'Juan',
            apellidos: 'Operador',
            email: this.email,
            celular: '999999999',
            rol: 'OPERADOR',
            sedeId: 1,
            conadisVerificado: false,
            tieneTarjetaGuardada: false
          };
          localStorage.setItem('usuario', JSON.stringify(operadorPrueba));
          this.redirigirPorRol('OPERADOR');
          return;
        }
        
        // Cliente de prueba
        if (this.email === 'mateo@test.com' && this.password === '123456') {
          const clientePrueba = {
            id: 3,
            nombres: 'Mateo',
            apellidos: 'Gutierrez Paz',
            email: this.email,
            celular: '987654321',
            rol: 'CLIENTE',
            conadisVerificado: true,
            tieneTarjetaGuardada: false
          };
          localStorage.setItem('usuario', JSON.stringify(clientePrueba));
          this.redirigirPorRol('CLIENTE');
          return;
        }
        
        this.errorMensaje = '❌ Error al iniciar sesión. Verifica tus credenciales.';
      }
    });
  }

  // ✅ Redirige según el rol
  private redirigirPorRol(rol: string): void {
    switch (rol) {
      case 'ADMIN':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'OPERADOR':
        this.router.navigate(['/operador/dashboard']);
        break;
      case 'CLIENTE':
      default:
        this.router.navigate(['/cliente/dashboard']);
        break;
    }
  }
}