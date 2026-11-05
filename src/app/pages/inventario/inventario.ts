import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { environment } from '../../../environments/environment';
import { HTTP_STATUS } from '../../constants/http-status';
import { Inventario, InventarioCreate, InventarioUpdate } from '../../models/inventario.model';
import { GenericService } from '../../services/generic.service';

type ModoPanel = 'crear' | 'editar' | 'ver';

interface InventarioFormulario {
  nombre_insumo: string;
  cantidad: number | null;
  unidad_medida: string;
}

@Component({
  selector: 'app-inventario',
  imports: [FormsModule],
  templateUrl: './inventario.html',
  styleUrl: './inventario.css',
})
export class InventarioComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly inventarioService = new GenericService<
    Inventario,
    InventarioCreate,
    InventarioUpdate
  >(this.http, 'inventario');

  readonly filas = signal<Inventario[]>([]);

  readonly mensaje = signal('');
  readonly esError = signal(false);
  readonly cargando = signal(false);
  readonly panelAbierto = signal(false);
  readonly modo = signal<ModoPanel>('crear');
  readonly soloLectura = computed(() => this.modo() === 'ver');
  readonly tituloPanel = computed(() => {
    switch (this.modo()) {
      case 'crear':
        return 'Nuevo insumo';
      case 'editar':
        return 'Editar insumo';
      default:
        return 'Detalle del insumo';
    }
  });

  idFiltro = '';
  formulario: InventarioFormulario = this.formularioVacio();
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
    this.inventarioService.obtener(id).subscribe({
      next: (insumo) => {
        this.filas.set([insumo]);
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
  ver(fila: Inventario): void {
    this.cargando.set(true);
    this.inventarioService.obtener(fila.id_insumo).subscribe({
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
    this.panelAbierto.set(true);
  }

  abrirEditar(fila: Inventario): void {
    this.modo.set('editar');
    this.idEditando = fila.id_insumo;
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
      this.avisar('Completa: insumo, cantidad (0 o más) y unidad de medida.', true);
      return;
    }

    this.cargando.set(true);
    if (this.modo() === 'crear') {
      this.inventarioService.crear(this.datosCreacion()).subscribe({
        next: (respuesta) => this.despuesDeGuardar(respuesta.message),
        error: (error: HttpErrorResponse) => this.falloGuardar(error),
      });
      return;
    }

    this.inventarioService.actualizar(this.idEditando, this.datosEdicion()).subscribe({
      next: (respuesta) => this.despuesDeGuardar(respuesta.message),
      error: (error: HttpErrorResponse) => this.falloGuardar(error),
    });
  }

  // ---------- Eliminar (DELETE) ----------

  eliminar(fila: Inventario): void {
    if (!confirm(`¿Eliminar el insumo "${fila.nombre_insumo}"?`)) {
      return;
    }

    this.cargando.set(true);
    this.inventarioService.eliminar(fila.id_insumo).subscribe({
      next: () => {
        this.avisar('Insumo eliminado');
        this.refrescar();
      },
      error: (error: HttpErrorResponse) => {
        this.avisar(this.textoError(error, false), true);
        this.cargando.set(false);
      },
    });
  }

  copiarId(fila: Inventario): void {
    navigator.clipboard
      .writeText(fila.id_insumo)
      .then(() => this.avisar('ID copiado. Pégalo en el buscador.'))
      .catch(() => this.avisar('No se pudo copiar el ID.', true));
  }

  // ---------- Internos ----------

  private cargarTodos(): void {
    this.cargando.set(true);
    this.inventarioService.listar().subscribe({
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
    return Boolean(
      f.nombre_insumo.trim() && f.unidad_medida.trim() && f.cantidad !== null && f.cantidad >= 0,
    );
  }

  private datosCreacion(): InventarioCreate {
    const f = this.formulario;
    return {
      nombre_insumo: f.nombre_insumo.trim(),
      cantidad: Number(f.cantidad),
      unidad_medida: f.unidad_medida.trim(),
      id_usuario_creacion: environment.usuarioAuditoriaId,
    };
  }

  private datosEdicion(): InventarioUpdate {
    const f = this.formulario;
    return {
      nombre_insumo: f.nombre_insumo.trim(),
      cantidad: Number(f.cantidad),
      unidad_medida: f.unidad_medida.trim(),
      id_usuario_edicion: environment.usuarioAuditoriaId,
    };
  }

  private formularioVacio(): InventarioFormulario {
    return {
      nombre_insumo: '',
      cantidad: null,
      unidad_medida: '',
    };
  }

  private formularioDesde(fila: Inventario): InventarioFormulario {
    return {
      nombre_insumo: fila.nombre_insumo,
      cantidad: fila.cantidad,
      unidad_medida: fila.unidad_medida,
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
      return 'Revisa los datos. La cantidad debe ser un número y los IDs tienen que ser UUID válidos.';
    }
    if (error.status === HTTP_STATUS.ERROR_SERVIDOR) {
      return 'El servidor no pudo completar la operación. Puede que el insumo esté en uso en algún plato.';
    }
    const detail = error.error?.detail;
    if (typeof detail === 'string') {
      return detail;
    }
    return 'No se pudo completar la operación';
  }
}
