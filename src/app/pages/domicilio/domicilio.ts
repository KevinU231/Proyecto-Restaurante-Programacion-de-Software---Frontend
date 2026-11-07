import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { environment } from '../../../environments/environment';
import { HTTP_STATUS } from '../../constants/http-status';
import { Cliente, ClienteCreate, ClienteUpdate } from '../../models/cliente.model';
import { Domicilio, DomicilioCreate, DomicilioUpdate } from '../../models/domicilio.model';
import { Plato, PlatoCreate, PlatoUpdate } from '../../models/plato.model';
import { GenericService } from '../../services/generic.service';

type ModoPanel = 'crear' | 'editar' | 'ver';

const ESTADOS = ['pendiente', 'en camino', 'entregado', 'cancelado'];

interface DomicilioFormulario {
  id_cliente: string;
  direccion_entrega: string;
  estado: string;
  ids_platos: string[];
}

@Component({
  selector: 'app-domicilio',
  imports: [FormsModule],
  templateUrl: './domicilio.html',
  styleUrl: './domicilio.css',
})
export class DomicilioComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly domicilioService = new GenericService<
    Domicilio,
    DomicilioCreate,
    DomicilioUpdate
  >(this.http, 'domicilios');
  /** Solo se usan para listar las opciones que se pueden elegir en el formulario. */
  private readonly clienteService = new GenericService<Cliente, ClienteCreate, ClienteUpdate>(
    this.http,
    'clientes',
  );
  private readonly platoService = new GenericService<Plato, PlatoCreate, PlatoUpdate>(
    this.http,
    'platos',
  );

  readonly filas = signal<Domicilio[]>([]);
  readonly clientes = signal<Cliente[]>([]);
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
        return 'Nuevo domicilio';
      case 'editar':
        return 'Editar domicilio';
      default:
        return 'Detalle del domicilio';
    }
  });

  idFiltro = '';
  formulario: DomicilioFormulario = this.formularioVacio();
  private idEditando = '';

  ngOnInit(): void {
    this.cargarTodos();
    this.cargarClientes();
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
    this.domicilioService.obtener(id).subscribe({
      next: (domicilio) => {
        this.filas.set([domicilio]);
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
  ver(fila: Domicilio): void {
    this.cargando.set(true);
    this.domicilioService.obtener(fila.id_domicilio).subscribe({
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
    this.cargarClientes();
    this.cargarPlatos();
    this.panelAbierto.set(true);
  }

  abrirEditar(fila: Domicilio): void {
    this.modo.set('editar');
    this.idEditando = fila.id_domicilio;
    this.formulario = this.formularioDesde(fila);
    this.cargarClientes();
    this.cargarPlatos();
    this.panelAbierto.set(true);
  }

  cerrarPanel(): void {
    this.panelAbierto.set(false);
  }

  // ---------- Selectores del formulario ----------

  /** Al elegir un cliente, si la dirección está vacía se rellena con la del cliente. */
  elegirCliente(idCliente: string): void {
    this.formulario.id_cliente = idCliente;
    if (!this.formulario.direccion_entrega.trim()) {
      const cliente = this.clientes().find((c) => c.id_cliente === idCliente);
      if (cliente?.direccion) {
        this.formulario.direccion_entrega = cliente.direccion;
      }
    }
  }

  nombreCliente(idCliente: string): string {
    const cliente = this.clientes().find((c) => c.id_cliente === idCliente);
    return cliente ? cliente.nombre : `${idCliente.slice(0, 8)}…`;
  }

  opcionesEstado(): string[] {
    const actual = this.formulario.estado;
    return actual && !ESTADOS.includes(actual) ? [...ESTADOS, actual] : ESTADOS;
  }

  tienePlato(idPlato: string): boolean {
    return this.formulario.ids_platos.includes(idPlato);
  }

  alternarPlato(idPlato: string): void {
    const ids = this.formulario.ids_platos;
    this.formulario.ids_platos = ids.includes(idPlato)
      ? ids.filter((id) => id !== idPlato)
      : [...ids, idPlato];
  }

  nombresPlatos(fila: Domicilio): string {
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
      this.avisar('Completa: cliente y dirección de entrega.', true);
      return;
    }

    this.cargando.set(true);
    if (this.modo() === 'crear') {
      this.domicilioService.crear(this.datosCreacion()).subscribe({
        next: (respuesta) => this.despuesDeGuardar(respuesta.message),
        error: (error: HttpErrorResponse) => this.falloGuardar(error),
      });
      return;
    }

    this.domicilioService.actualizar(this.idEditando, this.datosEdicion()).subscribe({
      next: (respuesta) => this.despuesDeGuardar(respuesta.message),
      error: (error: HttpErrorResponse) => this.falloGuardar(error),
    });
  }

  // ---------- Eliminar (DELETE) ----------

  eliminar(fila: Domicilio): void {
    if (!confirm('¿Eliminar este domicilio?')) {
      return;
    }

    this.cargando.set(true);
    this.domicilioService.eliminar(fila.id_domicilio).subscribe({
      next: () => {
        this.avisar('Domicilio eliminado');
        this.refrescar();
      },
      error: (error: HttpErrorResponse) => {
        this.avisar(this.textoError(error, false), true);
        this.cargando.set(false);
      },
    });
  }

  copiarId(fila: Domicilio): void {
    navigator.clipboard
      .writeText(fila.id_domicilio)
      .then(() => this.avisar('ID copiado. Pégalo en el buscador.'))
      .catch(() => this.avisar('No se pudo copiar el ID.', true));
  }

  // ---------- Internos ----------

  private cargarTodos(): void {
    this.cargando.set(true);
    this.domicilioService.listar().subscribe({
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

  /** Trae los clientes para poder elegirlos. Si no hay ninguno, la lista queda vacía. */
  private cargarClientes(): void {
    this.clienteService.listar().subscribe({
      next: (respuesta) => this.clientes.set(respuesta.data ?? []),
      error: () => this.clientes.set([]),
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
    const f = this.formulario;
    return Boolean(f.id_cliente && f.direccion_entrega.trim());
  }

  private datosCreacion(): DomicilioCreate {
    const f = this.formulario;
    return {
      id_cliente: f.id_cliente,
      direccion_entrega: f.direccion_entrega.trim(),
      ids_platos: [...f.ids_platos],
      estado: f.estado,
      id_usuario_creacion: environment.usuarioAuditoriaId,
    };
  }

  /** El backend no permite cambiar el cliente de un domicilio, por eso no se envía. */
  private datosEdicion(): DomicilioUpdate {
    const f = this.formulario;
    return {
      direccion_entrega: f.direccion_entrega.trim(),
      ids_platos: [...f.ids_platos],
      estado: f.estado,
      id_usuario_edicion: environment.usuarioAuditoriaId,
    };
  }

  private formularioVacio(): DomicilioFormulario {
    return {
      id_cliente: '',
      direccion_entrega: '',
      estado: 'pendiente',
      ids_platos: [],
    };
  }

  private formularioDesde(fila: Domicilio): DomicilioFormulario {
    return {
      id_cliente: fila.id_cliente,
      direccion_entrega: fila.direccion_entrega,
      estado: fila.estado,
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
      return 'Revisa los datos. Debes elegir un cliente y los IDs tienen que ser UUID válidos.';
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
