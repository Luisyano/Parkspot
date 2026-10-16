import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef, NgZone, ApplicationRef } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { EspacioService } from '../../../servicios/espacio.service';
import { SedeService } from '../../../servicios/sede.service';
import { Espacio } from '../../../modelos/espacio';
import { Sede } from '../../../modelos/sede';
import { Usuario } from '../../../modelos/usuario';

@Component({
  selector: 'app-mapa',
  imports: [RouterLink, CommonModule],
  templateUrl: './mapa.html',
  styleUrl: './mapa.css',
})
export class Mapa implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private espacioService = inject(EspacioService);
  private sedeService = inject(SedeService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private appRef = inject(ApplicationRef);

  sedeId: number = 0;
  sede: Sede | null = null;
  espacios: Espacio[] = [];
  espaciosPorPiso: { piso: string; espacios: Espacio[] }[] = [];
  espacioSeleccionado: Espacio | null = null;
  usuario: Usuario | null = null;

  cargando: boolean = true;
  errorMensaje: string = '';
  mensajeInfo: string = '';

  forceUpdate: number = 0;

  get fechaActual(): string {
    const hoy = new Date();
    return hoy.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  trackByPiso(index: number, item: { piso: string; espacios: Espacio[] }): string {
    return item.piso;
  }

  trackByEspacio(index: number, espacio: Espacio): number {
    return espacio.id;
  }

  ngOnInit(): void {
    this.sedeId = Number(this.route.snapshot.paramMap.get('id'));

    if (isPlatformBrowser(this.platformId)) {
      this.cargarUsuario();
    }

    if (this.sedeId) {
      this.ngZone.runOutsideAngular(() => {
        setTimeout(() => {
          this.ngZone.run(() => {
            this.cargarDatos();
          });
        }, 0);
      });
    } else {
      this.errorMensaje = 'No se especificó una sede.';
      this.cargando = false;
      this.cdr.detectChanges();
      this.appRef.tick();
    }
  }

  cargarUsuario(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const usuarioGuardado = localStorage.getItem('usuario');
      if (usuarioGuardado) {
        this.usuario = JSON.parse(usuarioGuardado);
        console.log('✅ Usuario cargado:', this.usuario);
      } else {
        console.warn('⚠️ No hay usuario en localStorage');
      }
    } catch (error) {
      console.error('Error al leer localStorage:', error);
    }
  }

  cargarDatos(): void {
    this.cargando = true;
    this.errorMensaje = '';
    this.cdr.detectChanges();

    this.sedeService.buscarPorId(this.sedeId).subscribe({
      next: (sede) => {
        this.sede = sede;
        this.espacioService.listarPorSede(this.sedeId).subscribe({
          next: (espacios) => {
            this.espacios = espacios;
            this.agruparPorPiso(espacios);
            
            this.ngZone.run(() => {
              setTimeout(() => {
                this.cargando = false;
                this.forceUpdate++;
                this.cdr.detectChanges();
                this.appRef.tick();
                console.log('✅ Mapa actualizado');
              }, 0);
            });
          },
          error: (err) => {
            console.error('Error cargando espacios:', err);
            this.errorMensaje = 'No se pudieron cargar los espacios.';
            this.cargando = false;
            this.cdr.detectChanges();
            this.appRef.tick();
          }
        });
      },
      error: (err) => {
        console.error('Error cargando sede:', err);
        this.errorMensaje = 'No se encontró la sede.';
        this.cargando = false;
        this.cdr.detectChanges();
        this.appRef.tick();
      }
    });
  }

  agruparPorPiso(espacios: Espacio[]): void {
    const mapa = new Map<number, Espacio[]>();
    espacios.forEach(esp => {
      const pisoId = esp.pisoId;
      if (!mapa.has(pisoId)) {
        mapa.set(pisoId, []);
      }
      mapa.get(pisoId)!.push(esp);
    });
    this.espaciosPorPiso = Array.from(mapa.entries()).map(([pisoId, espacios]) => ({
      piso: `Piso ${pisoId}`,
      espacios
    }));
  }

  // ✅ CAMBIO CLAVE: Bloquear RESERVADO también
  esSeleccionable(espacio: Espacio): boolean {
    if (espacio.estado === 'OCUPADO' || 
        espacio.estado === 'RESERVADO' || 
        espacio.estado === 'MANTENIMIENTO') {
      return false;
    }
    if (espacio.tipo === 'DISCAPACITADO') {
      return this.usuario?.conadisVerificado === true;
    }
    return true;
  }

  // ✅ Mensaje claro para cada caso
  getRazonNoSeleccionable(espacio: Espacio): string {
    if (espacio.estado === 'OCUPADO') return 'Este espacio está ocupado';
    if (espacio.estado === 'RESERVADO') return 'Este espacio ya está reservado';
    if (espacio.estado === 'MANTENIMIENTO') return 'Este espacio está en mantenimiento';
    if (espacio.tipo === 'DISCAPACITADO') {
      return this.usuario?.conadisVerificado
        ? 'Espacio para discapacitados'
        : '⚠️ Necesitas verificación CONADIS';
    }
    return '';
  }

  seleccionarEspacio(espacio: Espacio): void {
    if (!this.esSeleccionable(espacio)) {
      const razon = this.getRazonNoSeleccionable(espacio);
      this.mensajeInfo = razon;
      setTimeout(() => this.mensajeInfo = '', 3000);
      return;
    }

    if (this.espacioSeleccionado?.id === espacio.id) {
      this.espacioSeleccionado = null;
      this.mensajeInfo = '';
      return;
    }

    this.espacioSeleccionado = espacio;
    this.mensajeInfo = `✅ Espacio ${espacio.codigo} seleccionado`;
    setTimeout(() => this.mensajeInfo = '', 3000);
  }

  continuar(): void {
    if (this.espacioSeleccionado) {
      this.router.navigate(['/cliente/plan'], {
        queryParams: { espacioId: this.espacioSeleccionado.id }
      });
    }
  }

  getEstadoClass(espacio: Espacio): string {
    if (espacio.estado === 'DISPONIBLE') return 'available';
    if (espacio.estado === 'RESERVADO') return 'reserved';
    if (espacio.estado === 'OCUPADO') return 'occupied';
    if (espacio.estado === 'MANTENIMIENTO') return 'maintenance';
    return '';
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
      'REGULAR': '',
      'DISCAPACITADO': '♿',
      'MOTO': '🏍️'
    };
    return mapa[tipo] || '';
  }

  get conadisVerificado(): boolean {
    return this.usuario?.conadisVerificado === true;
  }
}