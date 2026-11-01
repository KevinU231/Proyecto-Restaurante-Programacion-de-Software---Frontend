
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HTTP_STATUS } from '../../constants/http-status';
import { environment } from '../../../environments/environment';

interface Pedido {
  id_pedido: string;
  id_empleado: string;
  id_cliente: string;
  id_mesa: string | null;
  estado: string;
  total: number;
}

interface PedidoCreate {
  id_empleado: string;
  id_cliente: string;
  id_mesa: string;
  estado: string;
  total: number;
}

type Modo = 'crear' | 'editar';

@Component({
  selector: 'app-pedidos',
  imports: [FormsModule, DecimalPipe],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.css',
})
export class Pedidos implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/pedidos/`;

  readonly pedidos = signal<Pedido[]>([]);
  readonly cargando = signal(false);
  readonly mensaje = signal('');
  readonly mensajePopup = signal('');
  readonly popupAbierto = signal(false);
  readonly modo = signal<Modo>('crear');

  idFiltro = '';
  idEnEdicion = '';
  formulario: PedidoCreate = this.formularioVacio();

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.mensaje.set('');

    this.http.get<{ data: Pedido[] }>(this.api).subscribe({
      next: (respuesta) => {
        this.pedidos.set(respuesta.data ?? []);
        this.cargando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.pedidos.set([]);
        this.cargando.set(false);
        this.mensaje.set(
          error.status === HTTP_STATUS.NO_ENCONTRADO
            ? 'No hay pedidos registrados.'
            : this.textoError(error, 'No se pudieron cargar los pedidos.'),
        );
      },
    });
  }

  buscarPorId(): void {
    const id = this.idFiltro.trim();
    if (!id) return this.cargar();

    this.cargando.set(true);
    this.mensaje.set('');

    this.http.get<Pedido>(`${this.api}${id}`).subscribe({
      next: (pedido) => {
        this.pedidos.set([pedido]);
        this.cargando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.pedidos.set([]);
        this.cargando.set(false);
        this.mensaje.set(this.textoError(error, 'No se pudo buscar el pedido.'));
      },
    });
  }

  limpiarFiltro(): void {
    this.idFiltro = '';
    this.cargar();
  }

  abrirCrear(): void {
    this.formulario = this.formularioVacio();
    this.idEnEdicion = '';
    this.mensajePopup.set('');
    this.modo.set('crear');
    this.popupAbierto.set(true);
  }

  abrirEditar(pedido: Pedido): void {
    this.formulario = {
      id_empleado: pedido.id_empleado,
      id_cliente: pedido.id_cliente,
      id_mesa: pedido.id_mesa ?? '',
      estado: pedido.estado,
      total: pedido.total,
    };
    this.idEnEdicion = pedido.id_pedido;
    this.mensajePopup.set('');
    this.modo.set('editar');
    this.popupAbierto.set(true);
  }

  cerrarPopup(): void {
    this.popupAbierto.set(false);
  }

  guardar(): void {
    const f = this.formulario;

    if (!f.id_empleado.trim() || !f.id_cliente.trim() || !f.estado.trim() || f.total < 0) {
      this.mensajePopup.set('Completa los campos obligatorios y verifica el total.');
      return;
    }

    const datos: any = {
      id_empleado: f.id_empleado.trim(),
      id_cliente: f.id_cliente.trim(),
      id_mesa: f.id_mesa.trim() || null,
      estado: f.estado.trim(),
      total: Number(f.total),
    };

    const peticion =
      this.modo() === 'crear'
        ? this.http.post(this.api, datos)
        : this.http.put(`${this.api}${this.idEnEdicion}`, {
            ...datos,
            id_usuario_edicion: environment.usuarioAuditoriaId,
          });

    peticion.subscribe({
      next: () => {
        const accion = this.modo();
        this.cerrarPopup();
        this.cargar();
        this.mensaje.set(accion === 'crear' ? 'Pedido creado correctamente.' : 'Pedido actualizado correctamente.');
      },
      error: (error: HttpErrorResponse) => {
        this.mensajePopup.set(this.textoError(error, 'No se pudo guardar el pedido.'));
      },
    });
  }

  eliminar(pedido: Pedido): void {
    if (!confirm(`¿Eliminar el pedido ${pedido.id_pedido}?`)) return;

    this.http.delete(`${this.api}${pedido.id_pedido}`).subscribe({
      next: () => {
        this.cargar();
        this.mensaje.set('Pedido eliminado correctamente.');
      },
      error: (error: HttpErrorResponse) => {
        this.mensaje.set(this.textoError(error, 'No se pudo eliminar el pedido.'));
      },
    });
  }

  private formularioVacio(): PedidoCreate {
    return {
      id_empleado: '',
      id_cliente: '',
      id_mesa: '',
      estado: 'Pendiente',
      total: 0,
    };
  }

  private textoError(error: HttpErrorResponse, porDefecto: string): string {
    switch (error.status) {
      case HTTP_STATUS.SIN_CONEXION:
        return 'No hay conexión con el servidor. ¿Está encendido el backend?';
      case HTTP_STATUS.NO_ENCONTRADO:
        return typeof error.error?.detail === 'string' ? error.error.detail : 'No se encontró el registro.';
      case HTTP_STATUS.CONFLICTO:
        return 'Ese registro ya existe.';
      case HTTP_STATUS.DATOS_INVALIDOS:
        return 'Revisa los datos: los IDs deben ser UUID válidos y los campos obligatorios no pueden ir vacíos.';
      case HTTP_STATUS.ERROR_SERVIDOR:
        return 'El servidor no pudo completar la operación. Verifica que los empleados, clientes y mesas relacionados existan.';
      default:
        return porDefecto;
    }
  }
}
