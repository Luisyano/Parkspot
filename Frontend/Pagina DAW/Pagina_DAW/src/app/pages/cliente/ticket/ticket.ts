import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef, NgZone, ApplicationRef } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';

import { ReservaService } from '../../../servicios/reserva.service';
import { EspacioService } from '../../../servicios/espacio.service';
import { PlanService } from '../../../servicios/plan.service';
import { VehiculoService } from '../../../servicios/vehiculo.service';
import { TicketService } from '../../../servicios/ticket.service';

import { Reserva } from '../../../modelos/reserva';
import { Espacio } from '../../../modelos/espacio';
import { Plan } from '../../../modelos/plan';
import { Vehiculo } from '../../../modelos/vehiculo';
import { Usuario } from '../../../modelos/usuario';
import { Ticket as TicketModel } from '../../../modelos/ticket';

import jsPDF from 'jspdf';
// @ts-ignore - qrcode no tiene tipos oficiales
import QRCode from 'qrcode';

@Component({
  selector: 'app-ticket',
  imports: [RouterLink, CommonModule],
  templateUrl: './ticket.html',
  styleUrl: './ticket.css',
})
export class Ticket implements OnInit {

  // ==========================================
  // SERVICIOS
  // ==========================================
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private reservaService = inject(ReservaService);
  private espacioService = inject(EspacioService);
  private planService = inject(PlanService);
  private vehiculoService = inject(VehiculoService);
  private ticketService = inject(TicketService);

  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private appRef = inject(ApplicationRef);

  // ==========================================
  // DATOS DE LA URL
  // ==========================================
  reservaId: number = 0;
  total: number = 0;
  metodoPago: string = 'TARJETA';

  // ==========================================
  // DATOS CARGADOS
  // ==========================================
  reserva: Reserva | null = null;
  espacio: Espacio | null = null;
  plan: Plan | null = null;
  vehiculo: Vehiculo | null = null;
  usuario: Usuario | null = null;
  ticket: TicketModel | null = null;

  // ==========================================
  // ESTADO
  // ==========================================
  cargando: boolean = true;
  errorMensaje: string = '';
  codigoTicket: string = '';
  qrCodeDataURL: string = '';
  forceUpdate: number = 0;

  // ==========================================
  // HELPER
  // ==========================================
  trackById(index: number, item: any): number {
    return item?.id || index;
  }

  // ==========================================
  // CICLO DE VIDA
  // ==========================================
  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const usuarioGuardado = localStorage.getItem('usuario');
        if (usuarioGuardado) {
          this.usuario = JSON.parse(usuarioGuardado);
        }
      } catch {
        this.usuario = null;
      }
    }

    this.route.queryParams.subscribe(params => {
      this.reservaId = Number(params['reservaId']) || 0;
      this.metodoPago = params['metodo'] || 'TARJETA';

      if (!this.reservaId) {
        this.router.navigate(['/cliente/buscar']);
        return;
      }

      this.cargarDatos();
    });
  }

  // ==========================================
  // CARGAR DATOS
  // ==========================================
  async cargarDatos(): Promise<void> {
    this.cargando = true;
    this.errorMensaje = '';
    this.cdr.detectChanges();

    try {
      // ==========================================
      // 1. CARGAR RESERVA
      // ==========================================
      if (this.reservaId) {
        const reserva = await this.reservaService.buscarPorId(this.reservaId).toPromise();
        if (reserva) {
          this.reserva = reserva;
          this.total = this.calcularTotalDesdeReserva(reserva);
          console.log('✅ Reserva cargada:', reserva);
        }
      }

      // ==========================================
      // 2. CARGAR TICKET REAL DEL BACKEND
      // ==========================================
      if (this.reservaId) {
        try {
          const ticket = await this.ticketService.buscarPorReserva(this.reservaId).toPromise();
          if (ticket) {
            this.ticket = ticket;
            this.codigoTicket = ticket.codigo;
            console.log('✅ Ticket del backend:', ticket);
          }
        } catch (err: any) {
          if (err?.status === 404) {
            console.warn('⚠️ No hay ticket generado para esta reserva');
          } else {
            console.warn('⚠️ Error buscando ticket:', err);
          }
        }
      }

      // ==========================================
      // 3. SI NO EXISTE TICKET, FALLBACK
      // ==========================================
      if (!this.codigoTicket) {
        // Fallback: usar el ID de la reserva como identificador temporal
        this.codigoTicket = `PS-PENDIENTE-${this.reservaId}`;
        console.warn('⚠️ No hay ticket en el backend, usando código temporal');
      }

      // ==========================================
      // 4. GENERAR QR CON EL CÓDIGO REAL
      // ==========================================
      if (this.codigoTicket) {
        await this.generarQR(this.codigoTicket);
      }

      // ==========================================
      // 5. CARGAR ESPACIO, PLAN, VEHÍCULO
      // ==========================================
      if (this.reserva?.espacioId) {
        try {
          const espacio = await this.espacioService.buscarPorId(this.reserva.espacioId).toPromise();
          if (espacio) this.espacio = espacio;
        } catch (e) {
          console.warn('No se pudo cargar el espacio:', e);
        }
      }

      if (this.reserva?.planId) {
        try {
          const plan = await this.planService.buscarPorId(this.reserva.planId).toPromise();
          if (plan) this.plan = plan;
        } catch (e) {
          console.warn('No se pudo cargar el plan:', e);
        }
      }

      if (this.reserva?.vehiculoId) {
        try {
          const vehiculo = await this.vehiculoService.buscarPorId(this.reserva.vehiculoId).toPromise();
          if (vehiculo) this.vehiculo = vehiculo;
        } catch (e) {
          console.warn('No se pudo cargar el vehículo:', e);
        }
      }

      // ==========================================
      // 6. FINALIZAR
      // ==========================================
      this.cargando = false;
      this.forceUpdate++;
      this.cdr.detectChanges();
      this.appRef.tick();

    } catch (error) {
      console.error('❌ Error cargando ticket:', error);
      this.errorMensaje = 'No se pudo cargar la información del ticket.';
      this.cargando = false;
      this.cdr.detectChanges();
      this.appRef.tick();
    }
  }

  // ==========================================
  // CALCULAR TOTAL
  // ==========================================
  calcularTotalDesdeReserva(reserva: Reserva): number {
    if (!reserva.fechaInicio || !reserva.fechaFin) {
      return 0;
    }

    const planNombre = reserva.nombrePlan || 'POR_HORA';
    const PRECIO_BASE_POR_HORA = 5.00;

    let total = 0;

    if (planNombre === 'POR_HORA') {
      const inicio = new Date(reserva.fechaInicio);
      const fin = new Date(reserva.fechaFin);
      const horas = Math.max(1, Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60)));
      total = horas * PRECIO_BASE_POR_HORA;
    } else if (planNombre === 'MENSUAL') {
      total = PRECIO_BASE_POR_HORA * 30;
    } else if (planNombre === 'ANUAL') {
      total = PRECIO_BASE_POR_HORA * 365 * 0.75;
    }

    return total;
  }

  // ==========================================
  // GENERAR QR
  // ==========================================
  async generarQR(texto: string): Promise<void> {
    try {
      this.qrCodeDataURL = await QRCode.toDataURL(texto, {
        width: 150,
        margin: 2,
        color: {
          dark: '#12294A',
          light: '#FFFFFF',
        },
      });
    } catch (error) {
      console.warn('Error generando QR:', error);
    }
  }

  // ==========================================
  // DESCARGAR PDF
  // ==========================================
  descargarTicket(): void {
    const doc = new jsPDF();
    const total = this.total || 0;
    const qrDataURL = this.qrCodeDataURL;

    doc.setFontSize(20);
    doc.setTextColor(18, 41, 74);
    doc.text('ParkSpot', 105, 25, { align: 'center' });

    doc.setDrawColor(227, 230, 234);
    doc.line(20, 35, 190, 35);

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Código: ${this.codigoTicket}`, 20, 50);

    if (qrDataURL) {
      doc.addImage(qrDataURL, 'PNG', 145, 40, 45, 45);
    }

    doc.setFontSize(14);
    doc.setTextColor(26, 29, 35);

    const info: [string, string][] = [
      ['Espacio', this.espacio?.codigo || '—'],
      ['Vehículo', this.vehiculo?.placa || '—'],
      ['Modalidad', this.getNombrePlan(this.plan?.nombre || 'POR_HORA')],
      ['Método de pago', this.getMetodoPagoTexto()],
      ['Total pagado', `S/ ${total.toFixed(2)}`],
    ];

    let y = 70;
    info.forEach(([label, value]) => {
      doc.setFontSize(12);
      doc.setTextColor(150, 150, 150);
      doc.text(label + ':', 20, y);
      doc.setTextColor(26, 29, 35);
      doc.text(value, 120, y);
      y += 12;
    });

    y += 10;
    doc.setDrawColor(227, 230, 234);
    doc.line(20, y, 190, y);

    y += 15;
    doc.setFontSize(11);
    doc.setTextColor(150, 150, 150);
    doc.text('Presenta este ticket al operador al llegar.', 20, y);
    doc.setTextColor(201, 134, 26);
    doc.text('Tiempo de gracia: 15 min.', 20, y + 10);

    const fecha = new Date();
    doc.setFontSize(10);
    doc.setTextColor(180, 180, 180);
    doc.text(
      `Emitido: ${fecha.toLocaleDateString('es-ES')} ${fecha.toLocaleTimeString('es-ES')}`,
      20,
      y + 25
    );

    doc.save(`ticket-${this.codigoTicket}.pdf`);
  }

  // ==========================================
  // HELPERS
  // ==========================================
  getNombrePlan(nombre: string): string {
    const mapa: Record<string, string> = {
      POR_HORA: 'Por hora',
      MENSUAL: 'Mensual',
      ANUAL: 'Anual',
    };
    return mapa[nombre] || nombre;
  }

  getMetodoPagoTexto(): string {
    const mapa: Record<string, string> = {
      TARJETA: 'Tarjeta de crédito/débito',
      YAPE: 'Yape / Plin',
      EFECTIVO: 'Efectivo en sede',
    };
    return mapa[this.metodoPago] || this.metodoPago;
  }

  getIconoMetodoPago(): string {
    const mapa: Record<string, string> = {
      TARJETA: 'ti ti-credit-card',
      YAPE: 'ti ti-wallet',
      EFECTIVO: 'ti ti-building-bank',
    };
    return mapa[this.metodoPago] || 'ti ti-credit-card';
  }
}