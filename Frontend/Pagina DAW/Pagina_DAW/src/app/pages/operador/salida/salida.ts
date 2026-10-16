import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';

import { TicketService } from '../../../servicios/ticket.service';
import { Ticket } from '../../../modelos/ticket';

type Paso = 'buscar' | 'confirmar' | 'exito';

@Component({
  selector: 'app-salida',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './salida.html',
  styleUrl: './salida.css',
})
export class Salida implements OnInit {

  private ticketService = inject(TicketService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  // ==========================================
  // ESTADO
  // ==========================================
  paso: Paso = 'buscar';
  codigoBusqueda = '';
  buscando = false;
  procesando = false;
  errorMensaje = '';

  ticket: Ticket | null = null;

  // ==========================================
  // CICLO DE VIDA
  // ==========================================
  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
  }

  // ==========================================
  // LIMPIAR CÓDIGO (quita QR_ si viene)
  // ==========================================
  private limpiarCodigo(codigo: string): string {
    let limpio = codigo.trim();
    if (limpio.toUpperCase().startsWith('QR_')) {
      limpio = limpio.substring(3);
    }
    return limpio.trim();
  }

  // ==========================================
  // BUSCAR TICKET POR CÓDIGO
  // ==========================================
  buscarTicket(): void {
    const codigoLimpio = this.limpiarCodigo(this.codigoBusqueda);

    if (!codigoLimpio) {
      this.errorMensaje = 'Ingresa un código de ticket';
      setTimeout(() => this.errorMensaje = '', 4000);
      return;
    }

    this.codigoBusqueda = codigoLimpio;
    this.buscando = true;
    this.errorMensaje = '';
    this.ticket = null;
    this.cdr.detectChanges();

    this.ticketService.buscarPorCodigo(codigoLimpio).subscribe({
      next: (ticket) => {
        console.log('✅ Ticket encontrado:', ticket);

        // Validación 1: debe haber ingresado
        if (!ticket.fechaIngresoReal) {
          this.errorMensaje = 'El vehículo no ha ingresado todavía. No se puede registrar salida.';
          this.buscando = false;
          this.cdr.detectChanges();
          return;
        }

        // Validación 2: no debe haber salido
        if (ticket.fechaSalidaReal) {
          this.errorMensaje = 'El vehículo ya salió. Este ticket ya fue usado.';
          this.buscando = false;
          this.cdr.detectChanges();
          return;
        }

        this.ticket = ticket;
        this.paso = 'confirmar';
        this.buscando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error buscando ticket:', err);
        if (err.status === 404) {
          this.errorMensaje = `No se encontró ningún ticket con el código "${codigoLimpio}"`;
        } else if (err.status === 0) {
          this.errorMensaje = 'No se pudo conectar con el servidor';
        } else {
          this.errorMensaje = 'Error al buscar el ticket';
        }
        this.buscando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ==========================================
  // CONFIRMAR SALIDA
  // ==========================================
  confirmarSalida(): void {
    if (!this.ticket) return;

    this.procesando = true;
    this.errorMensaje = '';
    this.cdr.detectChanges();

    this.ticketService.registrarSalida(this.ticket.id).subscribe({
      next: (ticketActualizado) => {
        console.log('✅ Salida registrada:', ticketActualizado);
        this.ticket = ticketActualizado;
        this.paso = 'exito';
        this.procesando = false;
        this.cdr.detectChanges();

        // Redirigir después de 3 segundos
        setTimeout(() => {
          this.router.navigate(['/operador/dashboard']);
        }, 3000);
      },
      error: (err) => {
        console.error('❌ Error registrando salida:', err);

        let mensaje = 'Error al registrar la salida';
        if (err.status === 400) {
          if (typeof err.error === 'string') {
            mensaje = err.error;
          } else if (err.error?.message) {
            mensaje = err.error.message;
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
  // CANCELAR / REINICIAR
  // ==========================================
  cancelar(): void {
    this.ticket = null;
    this.codigoBusqueda = '';
    this.errorMensaje = '';
    this.paso = 'buscar';
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

  formatearHora(fecha: string | null | undefined): string {
    if (!fecha) return '—';
    const d = new Date(fecha);
    return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  }

  calcularTiempoUsado(): string {
    if (!this.ticket?.fechaIngresoReal) return '—';

    const ingreso = new Date(this.ticket.fechaIngresoReal);
    const ahora = new Date();
    const diffMs = ahora.getTime() - ingreso.getTime();
    const totalMin = Math.floor(diffMs / 60000);
    const horas = Math.floor(totalMin / 60);
    const minutos = totalMin % 60;

    if (horas === 0) return `${minutos} min`;
    if (minutos === 0) return `${horas} h`;
    return `${horas} h ${minutos} min`;
  }

  get tieneExceso(): boolean {
    return (this.ticket?.cobroAdicional || 0) > 0;
  }

  get totalConExceso(): number {
    if (!this.ticket) return 0;
    return (this.ticket.montoPagado || 0) + (this.ticket.cobroAdicional || 0);
  }
}