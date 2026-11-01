
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HTTP_STATUS } from '../../constants/http-status';
import { environment } from '../../../environments/environment';

interface DetallePedido {
  id_detalle_pedido: string;
  id_pedido: string;
  id_plato: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

interface DetallePedidoCreate {
  id_pedido: string;
  id_plato: string;
  cantidad: number;
  precio_unitario: number;
}

type Modo = 'crear' | 'editar';

@Component({
  selector: 'app-detalles-pedido',
  imports: [FormsModule, DecimalPipe],
  templateUrl: './detalles-pedido.html',
  styleUrl: './detalles-pedido.css',
})
export class DetallesPedido implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/detalles-pedido/`;

  readonly detalles = signal<DetallePedido[]>([]);
  readonly cargando = signal(false);
  readonly mensaje = signal('');
  readonly mensajePopup = signal('');
  readonly popupAbierto = signal(false);
  readonly modo = signal<Modo>('crear');

  idFiltro = '';
  idEnEdicion = '';
  formulario: DetallePedidoCreate = this.formularioVacio();

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.mensaje.set('');

    this.http.get<{ data: DetallePedido[] }>(this.api).subscribe({
      next: (respuesta) => {
        this.detalles.set(respuesta.data ?? []);
        this.cargando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.detalles.set([]);
        this.cargando.set(false);
        this.mensaje.set(
          error.status === HTTP_STATUS.NO_ENCONTRADO
            ? 'No hay detalles de pedido registrados.'
            : this.textoError(error, 'No se pudieron cargar los detalles de pedido.'),
        );
      },
    });
  }

  buscarPorId(): void {
    const id = this.idFiltro.trim();
    if (!id) return this.cargar();

    this.cargando.set(true);
    this.mensaje.set('');

    this.http.get<DetallePedido>(`${this.api}${id}`).subscribe({
      next: (detalle) => {
        this.detalles.set([detalle]);
        this.cargando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.detalles.set([]);
        this.cargando.set(false);
        this.mensaje.set(this.textoError(error, 'No se pudo buscar el detalle de pedido.'));
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

  abrirEditar(detalle: DetallePedido): void {
    this.formulario = {
      id_pedido: detalle.id_pedido,
      id_plato: detalle.id_plato,
      cantidad: detalle.cantidad,
      precio_unitario: detalle.precio_unitario,
    };
    this.idEnEdicion = detalle.id_detalle_pedido;
    this.mensajePopup.set('');
    this.modo.set('editar');
    this.popupAbierto.set(true);
  }

  cerrarPopup(): void {
    this.popupAbierto.set(false);
  }

  guardar(): void {
    const f = this.formulario;

    if (!f.id_pedido.trim() || !f.id_plato.trim() || f.cantidad <= 0 || f.precio_unitario < 0) {
      this.mensajePopup.set('Completa los campos y verifica la cantidad y el precio.');
      return;
    }

    const datos = {
      id_pedido: f.id_pedido.trim(),
      id_plato: f.id_plato.trim(),
      cantidad: Number(f.cantidad),
      precio_unitario: Number(f.precio_unitario),
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
        this.mensaje.set(accion === 'crear' ? 'Detalle creado correctamente.' : 'Detalle actualizado correctamente.');
      },
      error: (error: HttpErrorResponse) => {
        this.mensajePopup.set(this.textoError(error, 'No se pudo guardar el detalle de pedido.'));
      },
    });
  }

  eliminar(detalle: DetallePedido): void {
    if (!confirm('¿Eliminar este detalle de pedido?')) return;

    this.http.delete(`${this.api}${detalle.id_detalle_pedido}`).subscribe({
      next: () => {
        this.cargar();
        this.mensaje.set('Detalle eliminado correctamente.');
      },
      error: (error: HttpErrorResponse) => {
        this.mensaje.set(this.textoError(error, 'No se pudo eliminar el detalle de pedido.'));
      },
    });
  }

  private formularioVacio(): DetallePedidoCreate {
    return { id_pedido: '', id_plato: '', cantidad: 1, precio_unitario: 0 };
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
        return 'Revisa los datos: los IDs deben ser UUID válidos y la cantidad y el precio deben ser válidos.';
      case HTTP_STATUS.ERROR_SERVIDOR:
        return 'El servidor no pudo completar la operación. Verifica que el pedido y el plato relacionados existan.';
      default:
        return porDefecto;
    }
  }
}
