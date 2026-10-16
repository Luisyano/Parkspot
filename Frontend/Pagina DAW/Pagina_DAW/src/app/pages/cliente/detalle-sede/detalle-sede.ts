import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SedeService } from '../../../servicios/sede.service';
import { EspacioService } from '../../../servicios/espacio.service';
import { Sede } from '../../../modelos/sede';
import { Espacio } from '../../../modelos/espacio';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-detalle-sede',
  imports: [RouterLink, CommonModule],
  templateUrl: './detalle-sede.html',
  styleUrl: './detalle-sede.css',
})
export class DetalleSede implements OnInit {
  private route = inject(ActivatedRoute);
  private sedeService = inject(SedeService);
  private espacioService = inject(EspacioService);
  private cdr = inject(ChangeDetectorRef);

  sede: Sede | null = null;
  espacios: Espacio[] = [];
  espaciosAgrupados: { piso: string; espacios: Espacio[] }[] = [];

  cargando: boolean = true;
  errorMensaje: string = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarDetalleSede(Number(id));
    } else {
      this.errorMensaje = 'No se especificó una sede.';
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  async cargarDetalleSede(id: number): Promise<void> {
    this.cargando = true;
    this.errorMensaje = '';
    this.cdr.detectChanges();

    try {
      // Obtener sede
      const sede = await firstValueFrom(this.sedeService.buscarPorId(id));
      if (!sede) {
        throw new Error('Sede no encontrada');
      }
      this.sede = sede;

      // Obtener espacios
      const espacios = await firstValueFrom(this.espacioService.listarPorSede(id));
      this.espacios = espacios || [];
      this.agruparEspaciosPorPiso(this.espacios);

      this.cargando = false;
      this.cdr.detectChanges();
      console.log('✅ Sede y espacios cargados:', { sede, espacios: this.espacios });

    } catch (error) {
      console.error('❌ Error en detalle-sede:', error);
      this.errorMensaje = 'No se pudo cargar la información de la sede. Intenta nuevamente.';
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  agruparEspaciosPorPiso(espacios: Espacio[]): void {
    const mapa = new Map<string, Espacio[]>();
    
    espacios.forEach(espacio => {
      // Usamos pisoId para agrupar (puedes mejorar si tienes el nombre del piso)
      const pisoKey = `Piso ${espacio.pisoId}`;
      if (!mapa.has(pisoKey)) {
        mapa.set(pisoKey, []);
      }
      mapa.get(pisoKey)!.push(espacio);
    });

    this.espaciosAgrupados = Array.from(mapa.entries()).map(([piso, espacios]) => ({
      piso,
      espacios: espacios.sort((a, b) => a.codigo.localeCompare(b.codigo))
    }));

    console.log('📋 Espacios agrupados:', this.espaciosAgrupados);
  }

  // Métodos para el HTML
  getTotalEspacios(): number {
    return this.espacios.length;
  }

  getEspaciosDisponibles(): number {
    return this.espacios.filter(e => e.estado === 'DISPONIBLE').length;
  }

  getPorcentajeDisponible(): number {
    const total = this.getTotalEspacios();
    if (total === 0) return 0;
    const disponibles = this.getEspaciosDisponibles();
    return Math.round((disponibles / total) * 100);
  }

  getEstadoBadge(estado: string): string {
    const mapa: Record<string, string> = {
      'DISPONIBLE': 'badge-available',
      'RESERVADO': 'badge-reserved',
      'OCUPADO': 'badge-occupied',
      'MANTENIMIENTO': 'badge-neutral'
    };
    return mapa[estado] || 'badge-neutral';
  }

  getEstadoTexto(estado: string): string {
    const mapa: Record<string, string> = {
      'DISPONIBLE': 'Disponible',
      'RESERVADO': 'Reservado',
      'OCUPADO': 'Ocupado',
      'MANTENIMIENTO': 'Mantenimiento'
    };
    return mapa[estado] || estado;
  }

  getTipoIcono(tipo: string): string {
    const mapa: Record<string, string> = {
      'REGULAR': '🅿️',
      'DISCAPACITADO': '♿',
      'MOTO': '🏍️'
    };
    return mapa[tipo] || '🅿️';
  }
}