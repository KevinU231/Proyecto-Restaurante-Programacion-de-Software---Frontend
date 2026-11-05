import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { environment } from '../../../environments/environment';
import { HTTP_STATUS } from '../../constants/http-status';
import { Usuario, UsuarioCreate, UsuarioUpdate, EmpleadoReferencia } from '../../models/usuario.model';
import { GenericService } from '../../services/generic.service';

type ModoPanel = 'crear' | 'editar' | 'ver';

interface UsuarioFormulario {
  id_empleado: string;
  nombre_usuario: string;
  primer_nombre: string;
  segundo_nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  clave: string;
}

@Component({
  selector: 'app-usuarios',
  imports: [FormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class Usuarios implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly usuarioService = new GenericService<Usuario, UsuarioCreate, UsuarioUpdate>(
    this.http,
    'usuarios',
  );
  private readonly empleadoService = new GenericService<EmpleadoReferencia, unknown, unknown>(
    this.http,
    'empleados',
  );

  readonly filas = signal<Usuario[]>([]);
  readonly empleados = signal<EmpleadoReferencia[]>([]);
  readonly mensaje = signal('');
  readonly esError = signal(false);
  readonly cargando = signal(false);
  readonly panelAbierto = signal(false);
  readonly modo = signal<ModoPanel>('crear');
  readonly soloLectura = computed(() => this.modo() === 'ver');
  readonly tituloPanel = computed(() => {
    switch (this.modo()) {
      case 'crear':
        return 'Nuevo usuario';
      case 'editar':
        return 'Editar usuario';
      default:
        return 'Detalle del usuario';
    }
  });

  idFiltro = '';
  formulario: UsuarioFormulario = this.formularioVacio();
  private idEditando = '';

  ngOnInit(): void {
    this.cargarTodos();
    this.cargarEmpleados();
  }

  // ---------- Consultar (GET) ----------

  buscarPorId(): void {
    const id = this.idFiltro.trim();
    if (!id) {
      this.cargarTodos();
      return;
    }

    this.cargando.set(true);
    this.usuarioService.obtener(id).subscribe({
      next: (u) => {
        this.filas.set([u]);
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
  ver(fila: Usuario): void {
    this.cargando.set(true);
    this.usuarioService.obtener(fila.id_usuario).subscribe({
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

  abrirEditar(fila: Usuario): void {
    this.modo.set('editar');
    this.idEditando = fila.id_usuario;
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
      this.avisar('Completa: empleado, nombre de usuario, primer nombre, primer apellido, clave.', true);
      return;
    }

    this.cargando.set(true);
    if (this.modo() === 'crear') {
      this.usuarioService.crear(this.datosCreacion()).subscribe({
        next: (respuesta) => this.despuesDeGuardar(respuesta.message),
        error: (error: HttpErrorResponse) => this.falloGuardar(error),
      });
      return;
    }

    this.usuarioService.actualizar(this.idEditando, this.datosEdicion()).subscribe({
      next: (respuesta) => this.despuesDeGuardar(respuesta.message),
      error: (error: HttpErrorResponse) => this.falloGuardar(error),
    });
  }

  // ---------- Eliminar (DELETE) ----------

  eliminar(fila: Usuario): void {
    if (!confirm('¿Eliminar este usuario?')) {
      return;
    }

    this.cargando.set(true);
    this.usuarioService.eliminar(fila.id_usuario).subscribe({
      next: () => {
        this.avisar('Usuario eliminado');
        this.refrescar();
      },
      error: (error: HttpErrorResponse) => {
        this.avisar(this.textoError(error, false), true);
        this.cargando.set(false);
      },
    });
  }

  copiarId(fila: Usuario): void {
    navigator.clipboard
      .writeText(fila.id_usuario)
      .then(() => this.avisar('ID copiado. Pégalo en el buscador.'))
      .catch(() => this.avisar('No se pudo copiar el ID.', true));
  }

  etiquetaEmpleado(x: EmpleadoReferencia): string {
    return `${x.nombre} (${x.cargo})`;
  }

  etiquetaEmpleadoPorId(id: string): string {
    const encontrado = this.empleados().find((x) => x.id_empleado === id);
    return encontrado ? this.etiquetaEmpleado(encontrado) : id.slice(0, 8);
  }

  private cargarEmpleados(): void {
    this.empleadoService.listar().subscribe({
      next: (respuesta) => this.empleados.set(respuesta.data ?? []),
      error: () => this.empleados.set([]),
    });
  }

  // ---------- Internos ----------

  private cargarTodos(): void {
    this.cargando.set(true);
    this.usuarioService.listar().subscribe({
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
      f.id_empleado &&
      f.nombre_usuario.trim() &&
      f.primer_nombre.trim() &&
      f.primer_apellido.trim(),
    );
    if (this.modo() === 'crear') {
      return base && f.clave.trim().length > 0;
    }
    return base;
  }

  private datosCreacion(): UsuarioCreate {
    const f = this.formulario;
    return {
      id_empleado: f.id_empleado,
      nombre_usuario: f.nombre_usuario.trim(),
      primer_nombre: f.primer_nombre.trim(),
      segundo_nombre: f.segundo_nombre.trim(),
      primer_apellido: f.primer_apellido.trim(),
      segundo_apellido: f.segundo_apellido.trim(),
      clave: f.clave,
      id_usuario_creacion: environment.usuarioAuditoriaId,
    };
  }

  private datosEdicion(): UsuarioUpdate {
    const f = this.formulario;
    const cambios: UsuarioUpdate = {
      nombre_usuario: f.nombre_usuario.trim(),
      primer_nombre: f.primer_nombre.trim(),
      segundo_nombre: f.segundo_nombre.trim(),
      primer_apellido: f.primer_apellido.trim(),
      segundo_apellido: f.segundo_apellido.trim(),
      id_usuario_edicion: environment.usuarioAuditoriaId,
    };
    if (f.clave.trim()) {
      cambios.clave = f.clave;
    }
    return cambios;
  }

  private formularioVacio(): UsuarioFormulario {
    return {
      id_empleado: '',
      nombre_usuario: '',
      primer_nombre: '',
      segundo_nombre: '',
      primer_apellido: '',
      segundo_apellido: '',
      clave: '',
    };
  }

  private formularioDesde(fila: Usuario): UsuarioFormulario {
    return {
      id_empleado: fila.id_empleado,
      nombre_usuario: fila.nombre_usuario,
      primer_nombre: fila.primer_nombre,
      segundo_nombre: fila.segundo_nombre,
      primer_apellido: fila.primer_apellido,
      segundo_apellido: fila.segundo_apellido,
      clave: '',
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
