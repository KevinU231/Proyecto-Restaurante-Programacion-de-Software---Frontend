import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { environment } from '../../../environments/environment';
import { HTTP_STATUS } from '../../constants/http-status';
import { Cliente, ClienteCreate, ClienteUpdate } from '../../models/cliente.model';
import { GenericService } from '../../services/generic.service';

type ModoPanel = 'crear' | 'editar' | 'ver';

interface ClienteFormulario {
  nombre: string;
  telefono: string;
  correo: string;
  direccion: string;
}

@Component({
  selector: 'app-clientes',
  imports: [FormsModule],
  templateUrl: './clientes.html',
  styleUrl: './clientes.css',
})
export class Clientes implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly clienteService = new GenericService<Cliente, ClienteCreate, ClienteUpdate>(
    this.http,
    'clientes',
  );


  readonly filas = signal<Cliente[]>([]);

  readonly mensaje = signal('');
  readonly esError = signal(false);
  readonly cargando = signal(false);
  readonly panelAbierto = signal(false);
  readonly modo = signal<ModoPanel>('crear');
  readonly soloLectura = computed(() => this.modo() === 'ver');
  readonly tituloPanel = computed(() => {
    switch (this.modo()) {
      case 'crear':
        return 'Nuevo cliente';
      case 'editar':
        return 'Editar cliente';
      default:
        return 'Detalle del cliente';
    }
  });

  idFiltro = '';
  formulario: ClienteFormulario = this.formularioVacio();
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
    this.clienteService.obtener(id).subscribe({
      next: (c) => {
        this.filas.set([c]);
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
  ver(fila: Cliente): void {
    this.cargando.set(true);
    this.clienteService.obtener(fila.id_cliente).subscribe({
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

  abrirEditar(fila: Cliente): void {
    this.modo.set('editar');
    this.idEditando = fila.id_cliente;
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
      this.avisar('Completa: nombre, teléfono.', true);
      return;
    }

    this.cargando.set(true);
    if (this.modo() === 'crear') {
      this.clienteService.crear(this.datosCreacion()).subscribe({
        next: (respuesta) => this.despuesDeGuardar(respuesta.message),
        error: (error: HttpErrorResponse) => this.falloGuardar(error),
      });
      return;
    }

    this.clienteService.actualizar(this.idEditando, this.datosEdicion()).subscribe({
      next: (respuesta) => this.despuesDeGuardar(respuesta.message),
      error: (error: HttpErrorResponse) => this.falloGuardar(error),
    });
  }

  // ---------- Eliminar (DELETE) ----------

  eliminar(fila: Cliente): void {
    if (!confirm('¿Eliminar este cliente?')) {
      return;
    }

    this.cargando.set(true);
    this.clienteService.eliminar(fila.id_cliente).subscribe({
      next: () => {
        this.avisar('Cliente eliminado');
        this.refrescar();
      },
      error: (error: HttpErrorResponse) => {
        this.avisar(this.textoError(error, false), true);
        this.cargando.set(false);
      },
    });
  }

  copiarId(fila: Cliente): void {
    navigator.clipboard
      .writeText(fila.id_cliente)
      .then(() => this.avisar('ID copiado. Pégalo en el buscador.'))
      .catch(() => this.avisar('No se pudo copiar el ID.', true));
  }


  // ---------- Internos ----------

  private cargarTodos(): void {
    this.cargando.set(true);
    this.clienteService.listar().subscribe({
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
      f.nombre.trim() &&
      f.telefono.trim(),
    );
    return base;
  }

  private datosCreacion(): ClienteCreate {
    const f = this.formulario;
    return {
      nombre: f.nombre.trim(),
      telefono: f.telefono.trim(),
      correo: f.correo.trim(),
      direccion: f.direccion.trim(),
      id_usuario_creacion: environment.usuarioAuditoriaId,
    };
  }

  private datosEdicion(): ClienteUpdate {
    const f = this.formulario;
    const cambios: ClienteUpdate = {
      nombre: f.nombre.trim(),
      telefono: f.telefono.trim(),
      correo: f.correo.trim(),
      direccion: f.direccion.trim(),
      id_usuario_edicion: environment.usuarioAuditoriaId,
    };
    return cambios;
  }

  private formularioVacio(): ClienteFormulario {
    return {
      nombre: '',
      telefono: '',
      correo: '',
      direccion: '',
    };
  }

  private formularioDesde(fila: Cliente): ClienteFormulario {
    return {
      nombre: fila.nombre,
      telefono: fila.telefono,
      correo: fila.correo,
      direccion: fila.direccion,
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
