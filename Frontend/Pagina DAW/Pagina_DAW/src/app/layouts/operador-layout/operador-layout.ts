import { Component, OnInit, OnDestroy, HostListener, inject, PLATFORM_ID } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-operador-layout',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './operador-layout.html',
  styleUrl: './operador-layout.css',
})
export class OperadorLayout implements OnInit, OnDestroy {

  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  // ==========================================
  // DATOS DEL OPERADOR
  // ==========================================
  nombreOperador = 'Operador';
  iniciales = 'OP';
  nombreSede = 'ParkSpot';

  // ==========================================
  // TURNO
  // ==========================================
  horaInicioTurno = '08:00';
  horaFinTurno = '16:00';
  tiempoTranscurrido = '00:00';

  // ==========================================
  // MENÚ DE USUARIO
  // ==========================================
  userMenuOpen = false;

  // ==========================================
  // NOTIFICACIONES
  // ==========================================
  totalNotificaciones = 0;

  private intervalId: any = null;

  // ==========================================
  // CICLO DE VIDA
  // ==========================================
  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarDatosOperador();
      this.iniciarRelojTurno();
    }
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  // ==========================================
  // CERRAR MENÚ AL HACER CLIC FUERA
  // ==========================================
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu-wrap')) {
      this.userMenuOpen = false;
    }
  }

  // ==========================================
  // TOGGLE MENÚ DE USUARIO
  // ==========================================
  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  // ==========================================
  // CARGAR DATOS DEL OPERADOR
  // ==========================================
  private cargarDatosOperador(): void {
    try {
      const usuarioGuardado = localStorage.getItem('usuario');
      if (usuarioGuardado) {
        const usuario = JSON.parse(usuarioGuardado);
        this.nombreOperador =
          `${usuario.nombres || ''} ${usuario.apellidos || ''}`.trim() || 'Operador';
        this.iniciales = this.calcularIniciales(usuario.nombres, usuario.apellidos);
      }

      const sedeGuardada = localStorage.getItem('sede');
      if (sedeGuardada) {
        const sede = JSON.parse(sedeGuardada);
        this.nombreSede = sede.nombre || 'ParkSpot';
      }
    } catch (e) {
      console.warn('No se pudieron cargar los datos del operador');
    }
  }

  private calcularIniciales(nombres: string = '', apellidos: string = ''): string {
    const n = nombres.charAt(0) || '';
    const a = apellidos.charAt(0) || '';
    return (n + a).toUpperCase() || 'OP';
  }

  // ==========================================
  // RELOJ DEL TURNO
  // ==========================================
  private iniciarRelojTurno(): void {
    this.actualizarTiempo();
    this.intervalId = setInterval(() => this.actualizarTiempo(), 60000);
  }

  private actualizarTiempo(): void {
    const ahora = new Date();
    const [hIni, mIni] = this.horaInicioTurno.split(':').map(Number);

    const inicio = new Date();
    inicio.setHours(hIni, mIni, 0, 0);

    if (inicio > ahora) {
      inicio.setDate(inicio.getDate() - 1);
    }

    const diffMs = ahora.getTime() - inicio.getTime();
    const totalMin = Math.floor(diffMs / 60000);
    const horas = Math.floor(totalMin / 60);
    const minutos = totalMin % 60;

    this.tiempoTranscurrido =
      `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
  }

  // ==========================================
  // CERRAR SESIÓN
  // ==========================================
  cerrarSesion(): void {
    const confirmar = confirm('¿Estás seguro que quieres cerrar sesión?');
    if (!confirmar) return;

    // Limpiar datos de sesión
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('rol');
    localStorage.removeItem('sede');

    // Redirigir al login
    this.router.navigate(['/login']);
  }
}