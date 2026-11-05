import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { environment } from '../../../environments/environment';
import { HTTP_STATUS } from '../../constants/http-status';
import { Mesa, MesaCreate, MesaUpdate } from '../../models/mesa.model';
import { GenericService } from '../../services/generic.service';

type ModoPanel = 'crear' | 'editar' | 'ver';

interface MesaFormulario {
  numero: number | null;
  capacidad: number | null;
  estado: string;
}

@Component({
  selector: 'app-mesas',
  imports: [FormsModule],
  templateUrl: './mesas.html',
  styleUrl: './mesas.css',
})
export class Mesas implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly mesaService = new GenericService<Mesa, MesaCreate, MesaUpdate>(
    this.http,
    'mesas',
  );


  readonly filas = signal<Mesa[]>([]);

  readonly mensaje = signal('');
  readonly esError = signal(false);
  readonly cargando = signal(false);
  readonly panelAbierto = signal(false);
  readonly modo = signal<ModoPanel>('crear');
  readonly soloLectura = computed(() => this.modo() === 'ver');
  readonly tituloPanel = computed(() => {
    switch (this.modo()) {
      case 'crear':
        return 'Nueva mesa';
      case 'editar':
        return 'Editar mesa';
      default:
        return 'Detalle de la mesa';
    }
  });

  idFiltro = '';
  formulario: MesaFormulario = this.formularioVacio();
  private idEditando = '';

  ngOnInit(): void {
    this.cargarTodos();

  }

  // ---------- Consultar (GET) ----------

  buscarPorId(): void {
    const id = this.idFiltro.trim();
    if (!id) {
      this.cargarTodos();
      return;
    }

    this.cargando.set(true);
    this.mesaService.obtener(id).subscribe({
      next: (m) => {
        this.filas.set([m]);
        this.avisar('');
        this.cargando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.filas.set([]);
        this.avisar(this.textoError(error, false), true);
        this.cargando.set(false);
      },
    });
  }

  limpiarFiltro(): void {
    this.idFiltro = '';
    this.cargarTodos();
  }

  /** GET por id y abre el panel solo lectura. */
  ver(fila: Mesa): void {
    this.cargando.set(true);
    this.mesaService.obtener(fila.id_mesa).subscribe({
      next: (completa) => {
        this.formulario = this.formularioDesde(completa);
        this.modo.set('ver');
        this.panelAbierto.set(true);
        this.cargando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.avisar(this.textoError(error, false), true);
        this.cargando.set(false);
      },
    });
  }

  // ---------- Panel lateral ----------

  abrirCrear(): void {
    this.modo.set('crear');
    this.idEditando = '';
    this.formulario = this.formularioVacio();
    this.panelAbierto.set(true);
  }

  abrirEditar(fila: Mesa): void {
    this.modo.set('editar');
    this.idEditando = fila.id_mesa;
    this.formulario = this.formularioDesde(fila);
    this.panelAbierto.set(true);
  }

  cerrarPanel(): void {
    this.panelAbierto.set(false);
  }

  // ---------- Crear y editar (POST / PUT) ----------

  guardar(): void {
    if (this.soloLectura()) {
      return;
    }
    if (!this.formularioValido()) {
      this.avisar('Completa: número, capacidad, estado.', true);
      return;
    }

    this.cargando.set(true);
    if (this.modo() === 'crear') {
      this.mesaService.crear(this.datosCreacion()).subscribe({
        next: (respuesta) => this.despuesDeGuardar(respuesta.message),
        error: (error: HttpErrorResponse) => this.falloGuardar(error),
      });
      return;
    }

    this.mesaService.actualizar(this.idEditando, this.datosEdicion()).subscribe({
      next: (respuesta) => this.despuesDeGuardar(respuesta.message),
      error: (error: HttpErrorResponse) => this.falloGuardar(error),
    });
  }

  // ---------- Eliminar (DELETE) ----------

  eliminar(fila: Mesa): void {
    if (!confirm('¿Eliminar esta mesa?')) {
      return;
    }

    this.cargando.set(true);
    this.mesaService.eliminar(fila.id_mesa).subscribe({
      next: () => {
        this.avisar('Mesa eliminada');
        this.refrescar();
      },
      error: (error: HttpErrorResponse) => {
        this.avisar(this.textoError(error, false), true);
        this.cargando.set(false);
      },
    });
  }

  copiarId(fila: Mesa): void {
    navigator.clipboard
      .writeText(fila.id_mesa)
      .then(() => this.avisar('ID copiado. Pégalo en el buscador.'))
      .catch(() => this.avisar('No se pudo copiar el ID.', true));
  }


  // ---------- Internos ----------

  private cargarTodos(): void {
    this.cargando.set(true);
    this.mesaService.listar().subscribe({
      next: (respuesta) => {
        const filas = respuesta.data ?? [];
        this.filas.set(filas);
        this.avisar(filas.length ? '' : 'No hay registros');
        this.cargando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.filas.set([]);
        const listaVacia = error.status === HTTP_STATUS.NO_ENCONTRADO;
        this.avisar(listaVacia ? 'No hay registros' : this.textoError(error, true), !listaVacia);
        this.cargando.set(false);
      },
    });
  }

  private refrescar(): void {
    if (this.idFiltro.trim()) {
      this.buscarPorId();
      return;
    }
    this.cargarTodos();
  }

  private despuesDeGuardar(texto: string): void {
    this.panelAbierto.set(false);
    this.avisar(texto);
    this.refrescar();
  }

  private falloGuardar(error: HttpErrorResponse): void {
    this.avisar(this.textoError(error, false), true);
    this.cargando.set(false);
  }

  private formularioValido(): boolean {
    const f = this.formulario;
    const base = Boolean(
      f.numero !== null && !Number.isNaN(Number(f.numero)) &&
      f.capacidad !== null && !Number.isNaN(Number(f.capacidad)) &&
      f.estado,
    );
    return base;
  }

  private datosCreacion(): MesaCreate {
    const f = this.formulario;
    return {
      numero: Number(f.numero),
      capacidad: Number(f.capacidad),
      estado: f.estado,
      id_usuario_creacion: environment.usuarioAuditoriaId,
    };
  }

  private datosEdicion(): MesaUpdate {
    const f = this.formulario;
    const cambios: MesaUpdate = {
      numero: Number(f.numero),
      capacidad: Number(f.capacidad),
      estado: f.estado,
      id_usuario_edicion: environment.usuarioAuditoriaId,
    };
    return cambios;
  }

  private formularioVacio(): MesaFormulario {
    return {
      numero: null,
      capacidad: null,
      estado: 'libre',
    };
  }

  private formularioDesde(fila: Mesa): MesaFormulario {
    return {
      numero: fila.numero,
      capacidad: fila.capacidad,
      estado: fila.estado,
    };
  }

  private avisar(texto: string, error = false): void {
    this.mensaje.set(texto);
    this.esError.set(error && texto.length > 0);
  }

  private textoError(error: HttpErrorResponse, alListar: boolean): string {
    if (error.status === HTTP_STATUS.SIN_CONEXION) {
      return 'No se pudo conectar con la API. Revisa que el backend esté en el puerto 8000.';
    }
    if (error.status === HTTP_STATUS.NO_ENCONTRADO) {
      return alListar ? 'No hay registros' : 'No encontrado';
    }
    if (error.status === HTTP_STATUS.DATOS_INVALIDOS) {
      return 'Revisa los datos. Los IDs tienen que ser UUID válidos.';
    }
    if (error.status === HTTP_STATUS.ERROR_SERVIDOR) {
      return 'El servidor no pudo completar la operación. Puede que el registro esté en uso o que un dato relacionado no exista.';
    }
    const detail = error.error?.detail;
    if (typeof detail === 'string') {
      return detail;
    }
    return 'No se pudo completar la operación';
  }
}
