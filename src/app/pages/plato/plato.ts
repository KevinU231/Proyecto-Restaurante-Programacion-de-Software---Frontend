import { DecimalPipe } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { environment } from '../../../environments/environment';
import { HTTP_STATUS } from '../../constants/http-status';
import { Inventario, InventarioCreate, InventarioUpdate } from '../../models/inventario.model';
import { Plato, PlatoCreate, PlatoUpdate } from '../../models/plato.model';
import { GenericService } from '../../services/generic.service';

type ModoPanel = 'crear' | 'editar' | 'ver';

interface PlatoFormulario {
  nombre: string;
  precio: number | null;
  descripcion: string;
  ids_insumos: string[];
}

@Component({
  selector: 'app-plato',
  imports: [FormsModule, DecimalPipe],
  templateUrl: './plato.html',
  styleUrl: './plato.css',
})
export class PlatoComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly platoService = new GenericService<Plato, PlatoCreate, PlatoUpdate>(
    this.http,
    'platos',
  );
  /** Solo se usa para listar los insumos que se pueden elegir en el formulario. */
  private readonly inventarioService = new GenericService<
    Inventario,
    InventarioCreate,
    InventarioUpdate
  >(this.http, 'inventario');

  readonly filas = signal<Plato[]>([]);
  readonly insumos = signal<Inventario[]>([]);

  readonly mensaje = signal('');
  readonly esError = signal(false);
  readonly cargando = signal(false);
  readonly panelAbierto = signal(false);
  readonly modo = signal<ModoPanel>('crear');
  readonly soloLectura = computed(() => this.modo() === 'ver');
  readonly tituloPanel = computed(() => {
    switch (this.modo()) {
      case 'crear':
        return 'Nuevo plato';
      case 'editar':
        return 'Editar plato';
      default:
        return 'Detalle del plato';
    }
  });

  idFiltro = '';
  formulario: PlatoFormulario = this.formularioVacio();
  private idEditando = '';

  ngOnInit(): void {
    this.cargarTodos();
    this.cargarInsumos();
  }

  // ---------- Consultar (GET) ----------

  buscarPorId(): void {
    const id = this.idFiltro.trim();
    if (!id) {
      this.cargarTodos();
      return;
    }

    this.cargando.set(true);
    this.platoService.obtener(id).subscribe({
      next: (plato) => {
        this.filas.set([plato]);
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
  ver(fila: Plato): void {
    this.cargando.set(true);
    this.platoService.obtener(fila.id_plato).subscribe({
      next: (completo) => {
        this.formulario = this.formularioDesde(completo);
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
    this.cargarInsumos();
    this.panelAbierto.set(true);
  }

  abrirEditar(fila: Plato): void {
    this.modo.set('editar');
    this.idEditando = fila.id_plato;
    this.formulario = this.formularioDesde(fila);
    this.cargarInsumos();
    this.panelAbierto.set(true);
  }

  cerrarPanel(): void {
    this.panelAbierto.set(false);
  }

  // ---------- Selector de insumos ----------

  tieneInsumo(idInsumo: string): boolean {
    return this.formulario.ids_insumos.includes(idInsumo);
  }

  alternarInsumo(idInsumo: string): void {
    const ids = this.formulario.ids_insumos;
    this.formulario.ids_insumos = ids.includes(idInsumo)
      ? ids.filter((id) => id !== idInsumo)
      : [...ids, idInsumo];
  }

  nombresInsumos(fila: Plato): string {
    return fila.insumos?.length
      ? fila.insumos.map((insumo) => insumo.nombre_insumo).join(', ')
      : 'Sin insumos';
  }

  // ---------- Crear y editar (POST / PUT) ----------

  guardar(): void {
    if (this.soloLectura()) {
      return;
    }
    if (!this.formularioValido()) {
      this.avisar('Completa: nombre y precio (0 o más).', true);
      return;
    }

    this.cargando.set(true);
    if (this.modo() === 'crear') {
      this.platoService.crear(this.datosCreacion()).subscribe({
        next: (respuesta) => this.despuesDeGuardar(respuesta.message),
        error: (error: HttpErrorResponse) => this.falloGuardar(error),
      });
      return;
    }

    this.platoService.actualizar(this.idEditando, this.datosEdicion()).subscribe({
      next: (respuesta) => this.despuesDeGuardar(respuesta.message),
      error: (error: HttpErrorResponse) => this.falloGuardar(error),
    });
  }

  // ---------- Eliminar (DELETE) ----------

  eliminar(fila: Plato): void {
    if (!confirm(`¿Eliminar el plato "${fila.nombre}"?`)) {
      return;
    }

    this.cargando.set(true);
    this.platoService.eliminar(fila.id_plato).subscribe({
      next: () => {
        this.avisar('Plato eliminado');
        this.refrescar();
      },
      error: (error: HttpErrorResponse) => {
        this.avisar(this.textoError(error, false), true);
        this.cargando.set(false);
      },
    });
  }

  copiarId(fila: Plato): void {
    navigator.clipboard
      .writeText(fila.id_plato)
      .then(() => this.avisar('ID copiado. Pégalo en el buscador.'))
      .catch(() => this.avisar('No se pudo copiar el ID.', true));
  }

  // ---------- Internos ----------

  private cargarTodos(): void {
    this.cargando.set(true);
    this.platoService.listar().subscribe({
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

  /** Trae los insumos para poder elegirlos. Si no hay ninguno, la lista queda vacía. */
  private cargarInsumos(): void {
    this.inventarioService.listar().subscribe({
      next: (respuesta) => this.insumos.set(respuesta.data ?? []),
      error: () => this.insumos.set([]),
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
    return Boolean(f.nombre.trim() && f.precio !== null && f.precio >= 0);
  }

  private datosCreacion(): PlatoCreate {
    const f = this.formulario;
    return {
      nombre: f.nombre.trim(),
      precio: Number(f.precio),
      descripcion: f.descripcion.trim(),
      ids_insumos: [...f.ids_insumos],
      id_usuario_creacion: environment.usuarioAuditoriaId,
    };
  }

  private datosEdicion(): PlatoUpdate {
    const f = this.formulario;
    return {
      nombre: f.nombre.trim(),
      precio: Number(f.precio),
      descripcion: f.descripcion.trim(),
      ids_insumos: [...f.ids_insumos],
      id_usuario_edicion: environment.usuarioAuditoriaId,
    };
  }

  private formularioVacio(): PlatoFormulario {
    return {
      nombre: '',
      precio: null,
      descripcion: '',
      ids_insumos: [],
    };
  }

  private formularioDesde(fila: Plato): PlatoFormulario {
    return {
      nombre: fila.nombre,
      precio: fila.precio,
      descripcion: fila.descripcion,
      ids_insumos: (fila.insumos ?? []).map((insumo) => insumo.id_insumo),
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
      return 'Revisa los datos. El precio debe ser un número y los IDs tienen que ser UUID válidos.';
    }
    if (error.status === HTTP_STATUS.ERROR_SERVIDOR) {
      return 'El servidor no pudo completar la operación. Puede que el plato esté en uso en un menú, un domicilio o un pedido.';
    }
    const detail = error.error?.detail;
    if (typeof detail === 'string') {
      return detail;
    }
    return 'No se pudo completar la operación';
  }
}
