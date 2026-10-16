import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SedeService } from '../../../servicios/sede.service';
import { Sede } from '../../../modelos/sede';

@Component({
  selector: 'app-sedes',
  imports: [CommonModule, FormsModule],
  templateUrl: './sedes.html',
  styleUrl: './sedes.css',
})
export class Sedes implements OnInit {

  private sedeService = inject(SedeService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  // ==========================================
  // ESTADO
  // ==========================================
  cargando = true;
  errorMensaje = '';

  // ==========================================
  // DATOS
  // ==========================================
  sedes: Sede[] = [];
  filtroEstado: string = 'TODOS';
  filtroDistrito: string = 'TODOS';

  // ==========================================
  // CICLO DE VIDA
  // ==========================================
  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarSedes();
    } else {
      this.cargando = false;
    }
  }

  // ==========================================
  // CARGAR SEDES
  // ==========================================
  cargarSedes(): void {
    this.cargando = true;
    this.errorMensaje = '';
    this.cdr.detectChanges();

    this.sedeService.listar().subscribe({
      next: (sedes) => {
        console.log('✅ Sedes cargadas:', sedes);
        this.sedes = sedes;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error cargando sedes:', err);
        this.errorMensaje = 'Error al cargar las sedes';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ==========================================
  // FILTROS (en frontend)
  // ==========================================
  get sedesFiltradas(): Sede[] {
    return this.sedes.filter(s => {
      const cumpleEstado = this.filtroEstado === 'TODOS' || s.estado === this.filtroEstado;
      const cumpleDistrito = this.filtroDistrito === 'TODOS' || s.distrito === this.filtroDistrito;
      return cumpleEstado && cumpleDistrito;
    });
  }

  get distritosUnicos(): string[] {
    return [...new Set(this.sedes.map(s => s.distrito))].sort();
  }

  // ==========================================
  // HELPERS
  // ==========================================
  getBadgeClass(estado: string): string {
    const mapa: Record<string, string> = {
      ACTIVA: 'b-active',
      PAUSADA: 'b-paused',
      INACTIVA: 'b-inactive'
    };
    return mapa[estado] || 'b-neutral';
  }

  getBadgeText(estado: string): string {
    const mapa: Record<string, string> = {
      ACTIVA: 'Activa',
      PAUSADA: 'Pausada',
      INACTIVA: 'Inactiva'
    };
    return mapa[estado] || estado;
  }

  formatearHora(hora: string): string {
    if (!hora) return '—';
    return hora.substring(0, 5);
  }
}