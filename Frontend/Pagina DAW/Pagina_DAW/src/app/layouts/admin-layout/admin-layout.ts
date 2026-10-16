import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
})
export class AdminLayout {
  
  private router = inject(Router);

  cerrarSesion(): void {
    // 1. Eliminar los datos de sesión del localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('rol');
    
    // O si guardas todo junto:
    // localStorage.clear();
    
    // 2. Redirigir al login
    this.router.navigate(['/login']);
  }
}