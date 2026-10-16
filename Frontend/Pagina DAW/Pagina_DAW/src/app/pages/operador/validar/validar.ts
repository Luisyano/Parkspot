import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { TicketService } from '../../../servicios/ticket.service';
import { Ticket } from '../../../modelos/ticket';

@Component({
  selector: 'app-validar',
  imports: [CommonModule, FormsModule],
  templateUrl: './validar.html',
  styleUrl: './validar.css',
})
export class Validar implements OnInit {

  private ticketService = inject(TicketService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  // ==========================================
  // ESTADO
  // ==========================================
  codigoBusqueda = '';
  buscando = false;
  errorMensaje = '';
  ticketEncontrado: Ticket | null = null;

  // ==========================================
  // CICLO DE VIDA
  // ==========================================
  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.buscando = false;
    }
  }

  // ==========================================
  // BUSCAR TICKET POR CÓDIGO
  // ==========================================
  buscarTicket(): void {
    const codigo = this.codigoBusqueda.trim();

    if (!codigo) {
      this.errorMensaje = 'Ingresa un código de ticket';
      setTimeout(() => this.errorMensaje = '', 4000);
      return;
    }

    this.buscando = true;
    this.errorMensaje = '';
    this.ticketEncontrado = null;
    this.cdr.detectChanges();

    this.ticketService.buscarPorCodigo(codigo).subscribe({
      next: (ticket) => {
        console.log('✅ Ticket encontrado:', ticket);
        this.ticketEncontrado = ticket;
        this.buscando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error buscando ticket:', err);
        if (err.status === 404) {
          this.errorMensaje = `No se encontró ningún ticket con el código "${codigo}"`;
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
  // LIMPIAR BÚSQUEDA
  // ==========================================
  limpiar(): void {
    this.codigoBusqueda = '';
    this.ticketEncontrado = null;
    this.errorMensaje = '';
  }

  // ==========================================
  // IR A LA PANTALLA DE INGRESO
  // ==========================================
  irAIngreso(): void {
    if (!this.ticketEncontrado) return;
    this.router.navigate(['/operador/ingreso'], {
      queryParams: { ticketId: this.ticketEncontrado.id }
    });
  }

  // ==========================================
  // HELPERS
  // ==========================================
  getEstadoTicket(t: Ticket): 'PENDIENTE' | 'INGRESADO' | 'SALIDO' {
    if (t.fechaSalidaReal) return 'SALIDO';
    if (t.fechaIngresoReal) return 'INGRESADO';
    return 'PENDIENTE';
  }

  getEstadoTexto(t: Ticket): string {
    const estado = this.getEstadoTicket(t);
    const mapa: Record<string, string> = {
      PENDIENTE: 'Pendiente de ingreso',
      INGRESADO: 'Vehículo ya ingresó',
      SALIDO: 'Vehículo ya salió'
    };
    return mapa[estado];
  }

  getEstadoBadgeClass(t: Ticket): string {
    const estado = this.getEstadoTicket(t);
    const mapa: Record<string, string> = {
      PENDIENTE: 'b-pending',
      INGRESADO: 'b-available',
      SALIDO: 'b-neutral'
    };
    return mapa[estado];
  }

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
}