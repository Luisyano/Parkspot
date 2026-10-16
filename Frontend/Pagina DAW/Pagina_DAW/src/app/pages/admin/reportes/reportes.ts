import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { SedeService } from '../../../servicios/sede.service';
import { EspacioService } from '../../../servicios/espacio.service';
import { PagoService } from '../../../servicios/pago.service';
import { ReservaService } from '../../../servicios/reserva.service';
import { UsuarioService } from '../../../servicios/usuario.service';

interface ReporteSede {
  sedeId: number;
  sedeNombre: string;
  distrito: string;
  totalEspacios: number;
  ocupados: number;
  disponibles: number;
  ocupacion: number;
  ingresos: number;
}

interface IngresoModalidad {
  modalidad: string;
  porcentaje: number;
  monto: number;
  color: string;
}

@Component({
  selector: 'app-reportes',
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css',
})
export class Reportes implements OnInit {

  private sedeService = inject(SedeService);
  private espacioService = inject(EspacioService);
  private pagoService = inject(PagoService);
  private reservaService = inject(ReservaService);
  private usuarioService = inject(UsuarioService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  // ==========================================
  // ESTADO
  // ==========================================
  cargando = true;
  errorMensaje = '';
  exportando = false;

  // ==========================================
  // DATOS
  // ==========================================
  tipoReporte: string = 'INGRESOS';
  mesSeleccionado: string = this.getMesActual();

  // KPIs generales
  ingresosTotales = 0;
  totalReservas = 0;
  totalUsuarios = 0;
  ocupacionPromedio = 0;

  // Datos de reportes
  reportesPorSede: ReporteSede[] = [];
  ingresosPorModalidad: IngresoModalidad[] = [];

  // ==========================================
  // CICLO DE VIDA
  // ==========================================
  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarReportes();
    } else {
      this.cargando = false;
    }
  }

  // ==========================================
  // CARGAR REPORTES
  // ==========================================
  cargarReportes(): void {
    this.cargando = true;
    this.errorMensaje = '';
    this.cdr.detectChanges();

    forkJoin({
      sedes: this.sedeService.listar().pipe(catchError(() => of([]))),
      usuarios: this.usuarioService.listarTodos().pipe(catchError(() => of([]))),
      reservas: this.reservaService.listarTodos().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ sedes, usuarios, reservas }) => {
        this.totalUsuarios = usuarios.length;
        this.totalReservas = reservas.length;

        // Por cada sede calcular espacios, ocupación e ingresos
        if (sedes.length > 0) {
          this.calcularPorSede(sedes);
        } else {
          this.cargando = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error cargando reportes:', err);
        this.errorMensaje = 'Error al cargar los reportes';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  private calcularPorSede(sedes: any[]): void {
    const peticiones = sedes.map((sede: any) =>
      forkJoin({
        espacios: this.espacioService.listarPorSede(sede.id).pipe(catchError(() => of([]))),
        ingresos: this.pagoService.totalIngresosPorSede(sede.id).pipe(catchError(() => of(0)))
      }).pipe(
        map(({ espacios, ingresos }) => {
          const totalEspacios = espacios.length;
          const ocupados = espacios.filter((e: any) => e.estado === 'OCUPADO').length;
          const disponibles = espacios.filter((e: any) => e.estado === 'DISPONIBLE').length;
          const ocupacion = totalEspacios > 0 ? Math.round((ocupados / totalEspacios) * 100) : 0;

          return {
            sedeId: sede.id,
            sedeNombre: sede.nombre,
            distrito: sede.distrito,
            totalEspacios,
            ocupados,
            disponibles,
            ocupacion,
            ingresos: ingresos || 0
          };
        })
      )
    );

    forkJoin(peticiones).subscribe({
      next: (resultados) => {
        this.reportesPorSede = resultados;

        // Calcular totales
        this.ingresosTotales = resultados.reduce((sum, r) => sum + r.ingresos, 0);

        const conDatos = resultados.filter(r => r.ocupacion > 0);
        this.ocupacionPromedio = conDatos.length > 0
          ? Math.round(conDatos.reduce((sum, r) => sum + r.ocupacion, 0) / conDatos.length)
          : 0;

        // Ingresos por modalidad (placeholder - calcular desde reservas)
        // Como no tenemos endpoint de ingresos por modalidad, lo aproximamos
        const total = this.ingresosTotales || 1;
        this.ingresosPorModalidad = [
          {
            modalidad: 'Mensual',
            porcentaje: 55,
            monto: total * 0.55,
            color: 'var(--navy)'
          },
          {
            modalidad: 'Por hora',
            porcentaje: 30,
            monto: total * 0.30,
            color: 'var(--accent)'
          },
          {
            modalidad: 'Anual',
            porcentaje: 15,
            monto: total * 0.15,
            color: 'var(--purple)'
          }
        ];

        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error calculando reportes:', err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ==========================================
  // EXPORTAR PDF
  // ==========================================
  exportarPDF(): void {
    if (this.reportesPorSede.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    this.exportando = true;
    this.cdr.detectChanges();

    try {
      const doc = new jsPDF();

      // Encabezado
      doc.setFontSize(20);
      doc.setTextColor(18, 41, 74);
      doc.text('ParkSpot - Reporte de Sedes', 105, 20, { align: 'center' });

      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generado: ${new Date().toLocaleString('es-PE')}`, 105, 28, { align: 'center' });

      // Línea divisoria
      doc.setDrawColor(227, 230, 234);
      doc.line(15, 33, 195, 33);

      // KPIs
      doc.setFontSize(12);
      doc.setTextColor(26, 29, 35);
      doc.text('Resumen General', 15, 45);

      const kpis = [
        ['Total de sedes', String(this.reportesPorSede.length)],
        ['Ingresos totales', `S/ ${this.ingresosTotales.toFixed(2)}`],
        ['Ocupación promedio', `${this.ocupacionPromedio}%`],
        ['Total usuarios', String(this.totalUsuarios)],
        ['Total reservas', String(this.totalReservas)]
      ];

      autoTable(doc, {
        startY: 50,
        head: [['Métrica', 'Valor']],
        body: kpis,
        theme: 'grid',
        headStyles: {
          fillColor: [18, 41, 74],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 10
        }
      });

      // Tabla de sedes
      const finalY = (doc as any).lastAutoTable.finalY + 15;

      doc.setFontSize(12);
      doc.setTextColor(26, 29, 35);
      doc.text('Detalle por Sede', 15, finalY);

      const rows = this.reportesPorSede.map(r => [
        r.sedeNombre,
        r.distrito,
        String(r.totalEspacios),
        String(r.ocupados),
        `${r.ocupacion}%`,
        `S/ ${r.ingresos.toFixed(2)}`
      ]);

      autoTable(doc, {
        startY: finalY + 5,
        head: [['Sede', 'Distrito', 'Espacios', 'Ocupados', 'Ocupación', 'Ingresos']],
        body: rows,
        theme: 'striped',
        headStyles: {
          fillColor: [18, 41, 74],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 9
        },
        columnStyles: {
          5: { halign: 'right' }
        }
      });

      // Ingresos por modalidad
      const finalY2 = (doc as any).lastAutoTable.finalY + 15;

      doc.setFontSize(12);
      doc.setTextColor(26, 29, 35);
      doc.text('Ingresos por Modalidad', 15, finalY2);

      const modalidades = this.ingresosPorModalidad.map(m => [
        m.modalidad,
        `${m.porcentaje}%`,
        `S/ ${m.monto.toFixed(2)}`
      ]);

      autoTable(doc, {
        startY: finalY2 + 5,
        head: [['Modalidad', 'Porcentaje', 'Monto']],
        body: modalidades,
        theme: 'grid',
        headStyles: {
          fillColor: [18, 41, 74],
          textColor: [255, 255, 255]
        },
        styles: {
          fontSize: 10
        },
        columnStyles: {
          2: { halign: 'right' }
        }
      });

      // Pie de página
      const totalPaginas = doc.getNumberOfPages();
      for (let i = 1; i <= totalPaginas; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `ParkSpot - Página ${i} de ${totalPaginas}`,
          105,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      doc.save(`parkspot-reporte-${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el PDF');
    } finally {
      this.exportando = false;
      this.cdr.detectChanges();
    }
  }

  // ==========================================
  // HELPERS
  // ==========================================
  private getMesActual(): string {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    return `${año}-${mes}`;
  }

  getColorOcupacion(porcentaje: number): string {
    if (porcentaje >= 80) return 'var(--occupied)';
    if (porcentaje >= 60) return 'var(--reserved)';
    return 'var(--available)';
  }

  getPorcentajeBarra(valor: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((valor / total) * 100);
  }
}