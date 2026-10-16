import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { SedeService } from '../../../servicios/sede.service';
import { EspacioService } from '../../../servicios/espacio.service';
import { Sede } from '../../../modelos/sede';
import { Espacio } from '../../../modelos/espacio';

@Component({
  selector: 'app-buscar',
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './buscar.html',
  styleUrl: './buscar.css',
})
export class Buscar implements OnInit {
  private sedeService = inject(SedeService);
  private espacioService = inject(EspacioService);
  private cdr = inject(ChangeDetectorRef);

  // Datos
  sedes: Sede[] = [];
  sedesFiltradas: Sede[] = [];

  // Filtros
  textoBusqueda: string = '';
  distritoSeleccionado: string = 'todos';
  tipoSeleccionado: string = 'todos';

  // Estados
  cargando: boolean = true;
  errorMensaje: string = '';

  // Distritos y tipos
  distritos: string[] = [];
  tiposEspacio: string[] = ['REGULAR', 'DISCAPACITADO', 'MOTO'];

  // Cache de espacios
  espaciosPorSede: Map<number, Espacio[]> = new Map();
  resumenSede: Map<number, { total: number, disponibles: number, porcentaje: number }> = new Map();

  // ============================================
  // PAGINACIÓN
  // ============================================
  paginaActual: number = 1;
  elementosPorPagina: number = 6;

  get sedesPaginadas(): Sede[] {
    const inicio = (this.paginaActual - 1) * this.elementosPorPagina;
    const fin = inicio + this.elementosPorPagina;
    return this.sedesFiltradas.slice(inicio, fin);
  }

  get totalPaginas(): number {
    return Math.ceil(this.sedesFiltradas.length / this.elementosPorPagina);
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaActual = pagina;
    // Scroll suave al inicio de resultados
    setTimeout(() => {
      document.querySelector('.resultados')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  // ============================================

  async ngOnInit(): Promise<void> {
    await this.cargarDatosCompletos();
  }

  async cargarDatosCompletos(): Promise<void> {
    this.cargando = true;
    this.errorMensaje = '';
    this.cdr.detectChanges();

    try {
      const sedes = await firstValueFrom(this.sedeService.listar());
      this.sedes = sedes.filter(s => s.estado === 'ACTIVA');
      this.extraerDistritos(this.sedes);

      if (this.sedes.length === 0) {
        this.errorMensaje = 'No hay sedes activas disponibles.';
        this.cargando = false;
        this.cdr.detectChanges();
        return;
      }

      const peticiones = this.sedes.map(sede =>
        firstValueFrom(this.espacioService.listarPorSede(sede.id))
      );

      const resultados = await Promise.allSettled(peticiones);

      resultados.forEach((resultado, index) => {
        const sede = this.sedes[index];
        if (resultado.status === 'fulfilled') {
          const espacios = resultado.value;
          this.espaciosPorSede.set(sede.id, espacios);
          const total = espacios.length;
          const disponibles = espacios.filter(e => e.estado === 'DISPONIBLE').length;
          const porcentaje = total > 0 ? Math.round((disponibles / total) * 100) : 0;
          this.resumenSede.set(sede.id, { total, disponibles, porcentaje });
        } else {
          this.espaciosPorSede.set(sede.id, []);
          this.resumenSede.set(sede.id, { total: 0, disponibles: 0, porcentaje: 0 });
        }
      });

      this.sedesFiltradas = [...this.sedes];
      this.paginaActual = 1; // Reset a primera página
      this.cargando = false;
      this.cdr.detectChanges();
      console.log('✅ Datos cargados correctamente');

    } catch (error) {
      console.error('❌ Error en carga:', error);
      this.errorMensaje = 'Error al cargar los datos. Verifica tu conexión.';
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  extraerDistritos(sedes: Sede[]): void {
    const set = new Set<string>();
    sedes.forEach(s => { if (s.distrito) set.add(s.distrito); });
    this.distritos = Array.from(set).sort();
  }

  buscar(): void {
    this.cargando = true;
    this.errorMensaje = '';
    this.cdr.detectChanges();

    let filtradas = this.sedes;

    if (this.distritoSeleccionado !== 'todos') {
      filtradas = filtradas.filter(s => s.distrito === this.distritoSeleccionado);
    }

    if (this.textoBusqueda.trim()) {
      const busqueda = this.textoBusqueda.toLowerCase().trim();
      filtradas = filtradas.filter(s =>
        s.nombre.toLowerCase().includes(busqueda) ||
        s.direccion.toLowerCase().includes(busqueda) ||
        s.distrito.toLowerCase().includes(busqueda)
      );
    }

    if (this.tipoSeleccionado !== 'todos') {
      filtradas = filtradas.filter(sede => {
        const espacios = this.espaciosPorSede.get(sede.id) || [];
        return espacios.some(e => e.tipo === this.tipoSeleccionado && e.estado === 'DISPONIBLE');
      });
    }

    this.sedesFiltradas = filtradas;
    this.paginaActual = 1; // 🔁 Reset a primera página al filtrar
    this.cargando = false;
    this.cdr.detectChanges();
  }

  resetearFiltros(): void {
    this.textoBusqueda = '';
    this.distritoSeleccionado = 'todos';
    this.tipoSeleccionado = 'todos';
    this.buscar();
  }

  obtenerTotalEspacios(sedeId: number): number {
    return this.resumenSede.get(sedeId)?.total || 0;
  }

  obtenerPorcentajeDisponible(sedeId: number): number {
    return this.resumenSede.get(sedeId)?.porcentaje || 0;
  }

  getDisponibilidadTexto(sedeId: number): string {
    return `${this.obtenerPorcentajeDisponible(sedeId)}% disponible`;
  }

  getDisponibilidadBadge(sedeId: number): string {
    const pct = this.obtenerPorcentajeDisponible(sedeId);
    if (pct >= 70) return 'badge-available';
    if (pct >= 40) return 'badge-reserved';
    return 'badge-occupied';
  }

  getImagenClass(sedeId: number): string {
    const clases: Record<number, string> = { 1: '', 2: 'segunda', 3: 'tercera' };
    return clases[sedeId] || '';
  }

  trackBySedeId(index: number, sede: Sede): number {
    return sede.id;
  }
}