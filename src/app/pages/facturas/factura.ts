
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HTTP_STATUS } from '../../constants/http-status';
import { environment } from '../../../environments/environment';

interface Factura {
  id_factura: string;
  id_pedido: string;
  metodo_pago: string;
  total: number;
}

interface FacturaCreate {
  id_pedido: string;
  metodo_pago: string;
  total: number;
}

type Modo = 'crear' | 'editar';

@Component({
  selector: 'app-facturas',
  imports: [FormsModule, DecimalPipe],
  templateUrl: './facturas.html',
  styleUrl: './facturas.css',
})
export class Facturas implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/facturas/`;

  readonly facturas = signal<Factura[]>([]);
  readonly cargando = signal(false);
  readonly mensaje = signal('');
  readonly mensajePopup = signal('');
  readonly popupAbierto = signal(false);
  readonly modo = signal<Modo>('crear');

  idFiltro = '';
  idEnEdicion = '';
  formulario: FacturaCreate = this.formularioVacio();

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.mensaje.set('');

    this.http.get<{ data: Factura[] }>(this.api).subscribe({
      next: (respuesta) => {
        this.facturas.set(respuesta.data ?? []);
        this.cargando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.facturas.set([]);
        this.cargando.set(false);
        this.mensaje.set(
          error.status === HTTP_STATUS.NO_ENCONTRADO
            ? 'No hay facturas registradas.'
            : this.textoError(error, 'No se pudieron cargar las facturas.'),
        );
      },
    });
  }

  buscarPorId(): void {
    const id = this.idFiltro.trim();
    if (!id) return this.cargar();

    this.cargando.set(true);
    this.mensaje.set('');

    this.http.get<Factura>(`${this.api}${id}`).subscribe({
      next: (factura) => {
        this.facturas.set([factura]);
        this.cargando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.facturas.set([]);
        this.cargando.set(false);
        this.mensaje.set(this.textoError(error, 'No se pudo buscar la factura.'));
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

  abrirEditar(factura: Factura): void {
    this.formulario = {
      id_pedido: factura.id_pedido,
      metodo_pago: factura.metodo_pago,
      total: factura.total,
    };
    this.idEnEdicion = factura.id_factura;
    this.mensajePopup.set('');
    this.modo.set('editar');
    this.popupAbierto.set(true);
  }

  cerrarPopup(): void {
    this.popupAbierto.set(false);
  }

  guardar(): void {
    const f = this.formulario;

    if (!f.id_pedido.trim() || !f.metodo_pago.trim() || f.total < 0) {
      this.mensajePopup.set('Completa los campos y verifica el total.');
      return;
    }

    const datos = {
      id_pedido: f.id_pedido.trim(),
      metodo_pago: f.metodo_pago.trim(),
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
        this.mensaje.set(accion === 'crear' ? 'Factura creada correctamente.' : 'Factura actualizada correctamente.');
      },
      error: (error: HttpErrorResponse) => {
        this.mensajePopup.set(this.textoError(error, 'No se pudo guardar la factura.'));
      },
    });
  }

  eliminar(factura: Factura): void {
    if (!confirm(`¿Eliminar la factura ${factura.id_factura}?`)) return;

    this.http.delete(`${this.api}${factura.id_factura}`).subscribe({
      next: () => {
        this.cargar();
        this.mensaje.set('Factura eliminada correctamente.');
      },
      error: (error: HttpErrorResponse) => {
        this.mensaje.set(this.textoError(error, 'No se pudo eliminar la factura.'));
      },
    });
  }

  private formularioVacio(): FacturaCreate {
    return { id_pedido: '', metodo_pago: '', total: 0 };
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
        return 'Revisa los datos: el ID del pedido debe ser un UUID válido y los campos obligatorios no pueden ir vacíos.';
      case HTTP_STATUS.ERROR_SERVIDOR:
        return 'El servidor no pudo completar la operación. Verifica que el pedido relacionado exista.';
      default:
        return porDefecto;
    }
  }
}
