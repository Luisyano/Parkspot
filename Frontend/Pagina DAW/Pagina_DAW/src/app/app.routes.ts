import { Routes } from '@angular/router';

// ============================================
// LAYOUTS
// ============================================
import { ClienteLayout } from './layouts/cliente-layout/cliente-layout';
import { OperadorLayout } from './layouts/operador-layout/operador-layout';
import { AdminLayout } from './layouts/admin-layout/admin-layout';

// ============================================
// PÁGINAS PÚBLICAS
// ============================================
import { Login } from './pages/cliente/login/login';
import { Registro } from './pages/cliente/registro/registro';
import { Landing } from './pages/cliente/landing/landing';

// ============================================
// PÁGINAS DEL CLIENTE
// ============================================
import { Dashboard } from './pages/cliente/dashboard/dashboard';
import { Inicio } from './pages/cliente/inicio/inicio';
import { Buscar } from './pages/cliente/buscar/buscar';
import { DetalleSede } from './pages/cliente/detalle-sede/detalle-sede';
import { ReservaComponent } from './pages/cliente/reserva/reserva';
import { MisReservas } from './pages/cliente/mis-reservas/mis-reservas';
import { Historial } from './pages/cliente/historial/historial';
import { Perfil } from './pages/cliente/perfil/perfil';
import { Membresias } from './pages/cliente/membresias/membresias';
import { Movil } from './pages/cliente/movil/movil';
import { Mapa } from './pages/cliente/mapa/mapa';
import { PlanComponent } from './pages/cliente/plan/plan';
import { Pago } from './pages/cliente/pago/pago';
import { Ticket } from './pages/cliente/ticket/ticket';
import { Notificaciones } from './pages/cliente/notificaciones/notificaciones';

// ============================================
// PÁGINAS DEL ADMIN (IMPORTADAS DESDE admin/)
// ============================================
import { Dashboard as AdminDashboard } from './pages/admin/dashboard/dashboard';
import { Sedes } from './pages/admin/sedes/sedes';
import { Planes } from './pages/admin/planes/planes';
import { Operadores } from './pages/admin/operadores/operadores';
import { Incidentes } from './pages/admin/incidentes/incidentes';
import { Reportes } from './pages/admin/reportes/reportes';

// ============================================
// PÁGINAS DEL OPERADOR (IMPORTADAS DESDE operador/)
// ============================================
import { Dashboard as OperadorDashboard } from './pages/operador/dashboard/dashboard';
import { Validar } from './pages/operador/validar/validar';
import { Ingreso } from './pages/operador/ingreso/ingreso';
import { Salida } from './pages/operador/salida/salida';
import { Mapa as OperadorMapa } from './pages/operador/mapa/mapa';
import { Incidente } from './pages/operador/incidente/incidente';
import { Alertas } from './pages/operador/alertas/alertas';
import { Historial as OperadorHistorial } from './pages/operador/historial/historial';
import { Login as OperadorLogin } from './pages/operador/login/login';

export const routes: Routes = [
  // ==========================================
  // RUTAS PÚBLICAS
  // ==========================================
  { path: '', redirectTo: 'landing', pathMatch: 'full' },
  { path: 'landing', component: Landing },
  { path: 'login', component: Login },
  { path: 'registro', component: Registro },

  // ==========================================
  // RUTAS DEL CLIENTE
  // ==========================================
  {
    path: 'cliente',
    component: ClienteLayout,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard },
      { path: 'inicio', component: Dashboard },
      { path: 'buscar', component: Buscar },
      { path: 'detalle-sede/:id', component: DetalleSede },
      { path: 'mapa/:id', component: Mapa },
      { path: 'plan', component: PlanComponent },
      { path: 'reserva', component: ReservaComponent },
      { path: 'pago', component: Pago },
      { path: 'ticket', component: Ticket },
      { path: 'mis-reservas', component: MisReservas },
      { path: 'historial', component: Historial },
      { path: 'perfil', component: Perfil },
      { path: 'membresias', component: Membresias },
      { path: 'movil', component: Movil },
      { path: 'notificaciones', component: Notificaciones }
    ]
  },

  // ==========================================
  // RUTAS DEL ADMIN
  // ==========================================
  {
    path: 'admin',
    component: AdminLayout,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboard },
      { path: 'sedes', component: Sedes },
      { path: 'planes', component: Planes },
      { path: 'operadores', component: Operadores },
      { path: 'incidentes', component: Incidentes },
      { path: 'reportes', component: Reportes }
    ]
  },

  // ==========================================
  // RUTAS DEL OPERADOR
  // ==========================================
  {
    path: 'operador',
    component: OperadorLayout,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: OperadorDashboard },
      { path: 'validar', component: Validar },
      { path: 'ingreso', component: Ingreso },
      { path: 'salida', component: Salida },
      { path: 'mapa', component: OperadorMapa },
      { path: 'incidente', component: Incidente },
      { path: 'alertas', component: Alertas },
      { path: 'historial', component: OperadorHistorial }
    ]
  },

  // ==========================================
  // RUTA 404
  // ==========================================
  { path: '**', redirectTo: 'landing' }
];