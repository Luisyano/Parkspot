import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';

import { TicketService } from '../../../servicios/ticket.service';
import { Ticket } from '../../../modelos/ticket';

@Component({
  selector: 'app-ingreso',
  imports: [CommonModule, RouterLink],
  templateUrl: './ingreso.html',
  styleUrl: './ingreso.css',
})
export class Ingreso implements OnInit {

  private ticketService = inject(TicketService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  // ==========================================
  // ESTADO
  // ==========================================
  cargando = true;
  procesando = false;
  errorMensaje = '';
  mensajeExito = '';

  ticket: Ticket | null = null;
  operadorId = 0;

  // ==========================================
  // CICLO DE VIDA
  // ==========================================
  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.cargando = false;
      return;
    }

    // Obtener operador desde localStorage
    try {
      const usuarioGuardado = localStorage.getItem('usuario');
      if (usuarioGuardado) {
        const u = JSON.parse(usuarioGuardado);
        this.operadorId = u.id;
      }
    } catch {
      this.operadorId = 0;
    }

    if (!this.operadorId) {
      this.errorMensaje = 'No se pudo identificar al operador';
      this.cargando = false;
      this.cdr.detectChanges();
      return;
    }

    // Leer ticketId desde los queryParams
    this.route.queryParams.subscribe(params => {
      const ticketId = Number(params['ticketId']) || 0;

      if (!ticketId) {
        this.errorMensaje = 'No se especificó un ticket para validar';
        this.cargando = false;
        this.cdr.detectChanges();
        return;
      }

      this.cargarTicket(ticketId);
    });
  }

  // ==========================================
  // CARGAR TICKET
  // ==========================================
  private cargarTicket(ticketId: number): void {
    this.cargando = true;
    this.errorMensaje = '';
    this.cdr.detectChanges();

    this.ticketService.buscarPorId(ticketId).subscribe({
      next: (ticket) => {
        console.log('✅ Ticket cargado:', ticket);

        if (ticket.fechaIngresoReal) {
          this.errorMensaje = 'Este vehículo ya ingresó previamente.';
        }

        this.ticket = ticket;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error cargando ticket:', err);
        if (err.status === 404) {
          this.errorMensaje = 'Ticket no encontrado';
        } else if (err.status === 0) {
          this.errorMensaje = 'No se pudo conectar con el servidor';
        } else {
          this.errorMensaje = 'Error al cargar el ticket';
        }
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ==========================================
  // CONFIRMAR INGRESO
  // ==========================================
  confirmarIngreso(): void {
    if (!this.ticket || !this.operadorId) {
      this.errorMensaje = 'Falta información para confirmar el ingreso';
      return;
    }

    if (this.ticket.fechaIngresoReal) {
      this.errorMensaje = 'Este vehículo ya ingresó.';
      return;
    }

    this.procesando = true;
    this.errorMensaje = '';
    this.mensajeExito = '';
    this.cdr.detectChanges();

    this.ticketService.registrarIngreso(this.ticket.id, this.operadorId).subscribe({
      next: (ticketActualizado) => {
        console.log('✅ Ingreso registrado:', ticketActualizado);

        this.ticket = ticketActualizado;
        this.mensajeExito = 'El vehículo fue autorizado y el espacio está ahora OCUPADO.';
        this.procesando = false;
        this.cdr.detectChanges();

        // Redirigir al dashboard después de 2.5 segundos
        setTimeout(() => {
          this.router.navigate(['/operador/dashboard']);
        }, 2500);
      },
      error: (err) => {
        console.error('❌ Error registrando ingreso:', err);

        let mensaje = 'Error al registrar el ingreso';
        if (err.status === 400) {
          if (err.error) {
            if (typeof err.error === 'string') {
              mensaje = err.error;
            } else if (err.error.message) {
              mensaje = err.error.message;
            }
          }
        } else if (err.status === 0) {
          mensaje = 'No se pudo conectar con el servidor';
        }

        this.errorMensaje = mensaje;
        this.procesando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ==========================================
  // VOLVER
  // ==========================================
  volver(): void {
    this.router.navigate(['/operador/validar']);
  }

  // ==========================================
  // HELPERS
  // ==========================================
  formatearFecha(fecha: string | null | undefined): string {
    if (!fecha) return '—';
    const d = new Date(fecha);
    return d.toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getBadgeEstado(): string {
    if (!this.ticket) return 'b-neutral';
    if (this.ticket.fechaSalidaReal) return 'b-neutral';
    if (this.ticket.fechaIngresoReal) return 'b-occupied';
    return 'b-pending';
  }

  getTextoEstado(): string {
    if (!this.ticket) return '—';
    if (this.ticket.fechaSalidaReal) return 'Vehículo salió';
    if (this.ticket.fechaIngresoReal) return 'Vehículo dentro';
    return 'Esperando ingreso';
  }
}