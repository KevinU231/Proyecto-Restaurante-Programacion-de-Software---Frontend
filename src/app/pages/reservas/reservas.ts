import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { environment } from '../../../environments/environment';
import { HTTP_STATUS } from '../../constants/http-status';
import { Reserva, ReservaCreate, ReservaUpdate } from '../../models/reserva.model';
import { Cliente } from '../../models/cliente.model';
import { Mesa } from '../../models/mesa.model';
import { GenericService } from '../../services/generic.service';

type ModoPanel = 'crear' | 'editar' | 'ver';

interface ReservaFormulario {
  id_cliente: string;
  id_mesa: string;
  fecha: string;
  hora: string;
  num_personas: number | null;
  estado: string;
}

@Component({
  selector: 'app-reservas',
  imports: [FormsModule],
  templateUrl: './reservas.html',
  styleUrl: './reservas.css',
})
export class Reservas implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly reservaService = new GenericService<Reserva, ReservaCreate, ReservaUpdate>(
    this.http,
    'reservas',
  );
  private readonly clienteService = new GenericService<Cliente, unknown, unknown>(
    this.http,
    'clientes',
  );
  private readonly mesaService = new GenericService<Mesa, unknown, unknown>(
    this.http,
    'mesas',
  );

  readonly filas = signal<Reserva[]>([]);
  readonly clientes = signal<Cliente[]>([]);
  readonly mesas = signal<Mesa[]>([]);
  readonly mensaje = signal('');
  readonly esError = signal(false);
  readonly cargando = signal(false);
  readonly panelAbierto = signal(false);
  readonly modo = signal<ModoPanel>('crear');
  readonly soloLectura = computed(() => this.modo() === 'ver');
  readonly tituloPanel = computed(() => {
    switch (this.modo()) {
      case 'crear':
        return 'Nueva reserva';
      case 'editar':
        return 'Editar reserva';
      default:
        return 'Detalle de la reserva';
    }
  });

  idFiltro = '';
  formulario: ReservaFormulario = this.formularioVacio();
  private idEditando = '';

  ngOnInit(): void {
    this.cargarTodos();
    this.cargarClientes();
    this.cargarMesas();
  }

  // ---------- Consultar (GET) ----------

  buscarPorId(): void {
    const id = this.idFiltro.trim();
    if (!id) {
      this.cargarTodos();
      return;
    }

    this.cargando.set(true);
    this.reservaService.obtener(id).subscribe({
      next: (r) => {
        this.filas.set([r]);
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
  ver(fila: Reserva): void {
    this.cargando.set(true);
    this.reservaService.obtener(fila.id_reserva).subscribe({
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

  abrirEditar(fila: Reserva): void {
    this.modo.set('editar');
    this.idEditando = fila.id_reserva;
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
      this.avisar('Completa: cliente, mesa, fecha, hora, personas, estado.', true);
      return;
    }

    this.cargando.set(true);
    if (this.modo() === 'crear') {
      this.reservaService.crear(this.datosCreacion()).subscribe({
        next: (respuesta) => this.despuesDeGuardar(respuesta.message),
        error: (error: HttpErrorResponse) => this.falloGuardar(error),
      });
      return;
    }

    this.reservaService.actualizar(this.idEditando, this.datosEdicion()).subscribe({
      next: (respuesta) => this.despuesDeGuardar(respuesta.message),
      error: (error: HttpErrorResponse) => this.falloGuardar(error),
    });
  }

  // ---------- Eliminar (DELETE) ----------

  eliminar(fila: Reserva): void {
    if (!confirm('¿Eliminar esta reserva?')) {
      return;
    }

    this.cargando.set(true);
    this.reservaService.eliminar(fila.id_reserva).subscribe({
      next: () => {
        this.avisar('Reserva eliminada');
        this.refrescar();
      },
      error: (error: HttpErrorResponse) => {
        this.avisar(this.textoError(error, false), true);
        this.cargando.set(false);
      },
    });
  }

  copiarId(fila: Reserva): void {
    navigator.clipboard
      .writeText(fila.id_reserva)
      .then(() => this.avisar('ID copiado. Pégalo en el buscador.'))
      .catch(() => this.avisar('No se pudo copiar el ID.', true));
  }

  etiquetaCliente(x: Cliente): string {
    return `${x.nombre} · ${x.telefono}`;
  }

  etiquetaClientePorId(id: string): string {
    const encontrado = this.clientes().find((x) => x.id_cliente === id);
    return encontrado ? this.etiquetaCliente(encontrado) : id.slice(0, 8);
  }

  private cargarClientes(): void {
    this.clienteService.listar().subscribe({
      next: (respuesta) => this.clientes.set(respuesta.data ?? []),
      error: () => this.clientes.set([]),
    });
  }

  etiquetaMesa(x: Mesa): string {
    return `Mesa ${x.numero} (${x.capacidad} personas)`;
  }

  etiquetaMesaPorId(id: string): string {
    const encontrado = this.mesas().find((x) => x.id_mesa === id);
    return encontrado ? this.etiquetaMesa(encontrado) : id.slice(0, 8);
  }

  private cargarMesas(): void {
    this.mesaService.listar().subscribe({
      next: (respuesta) => this.mesas.set(respuesta.data ?? []),
      error: () => this.mesas.set([]),
    });
  }

  // ---------- Internos ----------

  private cargarTodos(): void {
    this.cargando.set(true);
    this.reservaService.listar().subscribe({
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
      f.id_cliente &&
      f.id_mesa &&
      f.fecha &&
      f.hora &&
      f.num_personas !== null && !Number.isNaN(Number(f.num_personas)) &&
      f.estado,
    );
    return base;
  }

  private datosCreacion(): ReservaCreate {
    const f = this.formulario;
    return {
      id_cliente: f.id_cliente,
      id_mesa: f.id_mesa,
      fecha: f.fecha,
      hora: f.hora,
      num_personas: Number(f.num_personas),
      estado: f.estado,
      id_usuario_creacion: environment.usuarioAuditoriaId,
    };
  }

  private datosEdicion(): ReservaUpdate {
    const f = this.formulario;
    const cambios: ReservaUpdate = {
      fecha: f.fecha,
      hora: f.hora,
      num_personas: Number(f.num_personas),
      estado: f.estado,
      id_usuario_edicion: environment.usuarioAuditoriaId,
    };
    return cambios;
  }

  private formularioVacio(): ReservaFormulario {
    return {
      id_cliente: '',
      id_mesa: '',
      fecha: '',
      hora: '',
      num_personas: null,
      estado: 'confirmada',
    };
  }

  private formularioDesde(fila: Reserva): ReservaFormulario {
    return {
      id_cliente: fila.id_cliente,
      id_mesa: fila.id_mesa,
      fecha: fila.fecha,
      hora: fila.hora,
      num_personas: fila.num_personas,
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
