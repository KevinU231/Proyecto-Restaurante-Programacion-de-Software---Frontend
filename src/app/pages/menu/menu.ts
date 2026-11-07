import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { environment } from '../../../environments/environment';
import { HTTP_STATUS } from '../../constants/http-status';
import { Menu, MenuCreate, MenuUpdate } from '../../models/menu.model';
import { Plato, PlatoCreate, PlatoUpdate } from '../../models/plato.model';
import { GenericService } from '../../services/generic.service';

type ModoPanel = 'crear' | 'editar' | 'ver';

interface MenuFormulario {
  nombre: string;
  descripcion: string;
  ids_platos: string[];
}

@Component({
  selector: 'app-menu',
  imports: [FormsModule],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class MenuComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly menuService = new GenericService<Menu, MenuCreate, MenuUpdate>(
    this.http,
    'menus',
  );
  /** Solo se usa para listar los platos que se pueden elegir en el formulario. */
  private readonly platoService = new GenericService<Plato, PlatoCreate, PlatoUpdate>(
    this.http,
    'platos',
  );

  readonly filas = signal<Menu[]>([]);
  readonly platos = signal<Plato[]>([]);

  readonly mensaje = signal('');
  readonly esError = signal(false);
  readonly cargando = signal(false);
  readonly panelAbierto = signal(false);
  readonly modo = signal<ModoPanel>('crear');
  readonly soloLectura = computed(() => this.modo() === 'ver');
  readonly tituloPanel = computed(() => {
    switch (this.modo()) {
      case 'crear':
        return 'Nuevo menú';
      case 'editar':
        return 'Editar menú';
      default:
        return 'Detalle del menú';
    }
  });

  idFiltro = '';
  formulario: MenuFormulario = this.formularioVacio();
  private idEditando = '';

  ngOnInit(): void {
    this.cargarTodos();
    this.cargarPlatos();
  }

  // ---------- Consultar (GET) ----------

  buscarPorId(): void {
    const id = this.idFiltro.trim();
    if (!id) {
      this.cargarTodos();
      return;
    }

    this.cargando.set(true);
    this.menuService.obtener(id).subscribe({
      next: (menu) => {
        this.filas.set([menu]);
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
  ver(fila: Menu): void {
    this.cargando.set(true);
    this.menuService.obtener(fila.id_menu).subscribe({
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
    this.cargarPlatos();
    this.panelAbierto.set(true);
  }

  abrirEditar(fila: Menu): void {
    this.modo.set('editar');
    this.idEditando = fila.id_menu;
    this.formulario = this.formularioDesde(fila);
    this.cargarPlatos();
    this.panelAbierto.set(true);
  }

  cerrarPanel(): void {
    this.panelAbierto.set(false);
  }

  // ---------- Selector de platos ----------

  tienePlato(idPlato: string): boolean {
    return this.formulario.ids_platos.includes(idPlato);
  }

  alternarPlato(idPlato: string): void {
    const ids = this.formulario.ids_platos;
    this.formulario.ids_platos = ids.includes(idPlato)
      ? ids.filter((id) => id !== idPlato)
      : [...ids, idPlato];
  }

  nombresPlatos(fila: Menu): string {
    return fila.platos?.length
      ? fila.platos.map((plato) => plato.nombre).join(', ')
      : 'Sin platos';
  }

  // ---------- Crear y editar (POST / PUT) ----------

  guardar(): void {
    if (this.soloLectura()) {
      return;
    }
    if (!this.formularioValido()) {
      this.avisar('Completa: nombre del menú.', true);
      return;
    }

    this.cargando.set(true);
    if (this.modo() === 'crear') {
      this.menuService.crear(this.datosCreacion()).subscribe({
        next: (respuesta) => this.despuesDeGuardar(respuesta.message),
        error: (error: HttpErrorResponse) => this.falloGuardar(error),
      });
      return;
    }

    this.menuService.actualizar(this.idEditando, this.datosEdicion()).subscribe({
      next: (respuesta) => this.despuesDeGuardar(respuesta.message),
      error: (error: HttpErrorResponse) => this.falloGuardar(error),
    });
  }

  // ---------- Eliminar (DELETE) ----------

  eliminar(fila: Menu): void {
    if (!confirm(`¿Eliminar el menú "${fila.nombre}"?`)) {
      return;
    }

    this.cargando.set(true);
    this.menuService.eliminar(fila.id_menu).subscribe({
      next: () => {
        this.avisar('Menú eliminado');
        this.refrescar();
      },
      error: (error: HttpErrorResponse) => {
        this.avisar(this.textoError(error, false), true);
        this.cargando.set(false);
      },
    });
  }

  copiarId(fila: Menu): void {
    navigator.clipboard
      .writeText(fila.id_menu)
      .then(() => this.avisar('ID copiado. Pégalo en el buscador.'))
      .catch(() => this.avisar('No se pudo copiar el ID.', true));
  }

  // ---------- Internos ----------

  private cargarTodos(): void {
    this.cargando.set(true);
    this.menuService.listar().subscribe({
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

  /** Trae los platos para poder elegirlos. Si no hay ninguno, la lista queda vacía. */
  private cargarPlatos(): void {
    this.platoService.listar().subscribe({
      next: (respuesta) => this.platos.set(respuesta.data ?? []),
      error: () => this.platos.set([]),
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
    return Boolean(this.formulario.nombre.trim());
  }

  private datosCreacion(): MenuCreate {
    const f = this.formulario;
    return {
      nombre: f.nombre.trim(),
      descripcion: f.descripcion.trim(),
      ids_platos: [...f.ids_platos],
      id_usuario_creacion: environment.usuarioAuditoriaId,
    };
  }

  private datosEdicion(): MenuUpdate {
    const f = this.formulario;
    return {
      nombre: f.nombre.trim(),
      descripcion: f.descripcion.trim(),
      ids_platos: [...f.ids_platos],
      id_usuario_edicion: environment.usuarioAuditoriaId,
    };
  }

  private formularioVacio(): MenuFormulario {
    return {
      nombre: '',
      descripcion: '',
      ids_platos: [],
    };
  }

  private formularioDesde(fila: Menu): MenuFormulario {
    return {
      nombre: fila.nombre,
      descripcion: fila.descripcion,
      ids_platos: (fila.platos ?? []).map((plato) => plato.id_plato),
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
      return 'Revisa los datos. El nombre es obligatorio y los IDs tienen que ser UUID válidos.';
    }
    if (error.status === HTTP_STATUS.ERROR_SERVIDOR) {
      return 'El servidor no pudo completar la operación. Puede que un dato relacionado no exista.';
    }
    const detail = error.error?.detail;
    if (typeof detail === 'string') {
      return detail;
    }
    return 'No se pudo completar la operación';
  }
}
