
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HTTP_STATUS } from '../../constants/http-status';
import { environment } from '../../../environments/environment';

interface Empleado {
  id_empleado: string;
  nombre: string;
  telefono: string;
  correo: string;
  cargo: string;
}

interface EmpleadoCreate {
  nombre: string;
  telefono: string;
  correo: string;
  cargo: string;
}

type Modo = 'crear' | 'editar';

@Component({
  selector: 'app-empleados',
  imports: [FormsModule],
  templateUrl: './empleados.html',
  styleUrl: './empleados.css',
})
export class Empleados implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/empleados/`;

  readonly empleados = signal<Empleado[]>([]);
  readonly cargando = signal(false);
  readonly mensaje = signal('');
  readonly mensajePopup = signal('');
  readonly popupAbierto = signal(false);
  readonly modo = signal<Modo>('crear');

  idFiltro = '';
  idEnEdicion = '';

  formulario: EmpleadoCreate = this.formularioVacio();

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.mensaje.set('');

    this.http.get<{ data: Empleado[] }>(this.api).subscribe({
      next: (respuesta) => {
        this.empleados.set(respuesta.data ?? []);
        this.cargando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.empleados.set([]);
        this.cargando.set(false);
        this.mensaje.set(
          error.status === HTTP_STATUS.NO_ENCONTRADO
            ? 'No hay empleados registrados.'
            : this.textoError(error, 'No se pudieron cargar los empleados.'),
        );
      },
    });
  }

  buscarPorId(): void {
    const id = this.idFiltro.trim();

    if (!id) {
      this.cargar();
      return;
    }

    this.cargando.set(true);
    this.mensaje.set('');

    this.http.get<Empleado>(`${this.api}${id}`).subscribe({
      next: (empleado) => {
        this.empleados.set([empleado]);
        this.cargando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.empleados.set([]);
        this.cargando.set(false);
        this.mensaje.set(
          this.textoError(error, 'No se pudo buscar el empleado.'),
        );
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

  abrirEditar(empleado: Empleado): void {
    this.formulario = {
      nombre: empleado.nombre,
      telefono: empleado.telefono,
      correo: empleado.correo,
      cargo: empleado.cargo,
    };

    this.idEnEdicion = empleado.id_empleado;
    this.mensajePopup.set('');
    this.modo.set('editar');
    this.popupAbierto.set(true);
  }

  cerrarPopup(): void {
    this.popupAbierto.set(false);
  }

  guardar(): void {
    const f = this.formulario;

    if (!f.nombre.trim() || !f.telefono.trim() || !f.correo.trim() || !f.cargo.trim()) {
      this.mensajePopup.set('Completa todos los campos.');
      return;
    }

    this.mensajePopup.set('');

    const datos = {
      nombre: f.nombre.trim(),
      telefono: f.telefono.trim(),
      correo: f.correo.trim(),
      cargo: f.cargo.trim(),
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
        this.cerrarPopup();
        this.cargar();
        this.mensaje.set(
          this.modo() === 'crear'
            ? 'Empleado creado correctamente.'
            : 'Empleado actualizado correctamente.',
        );
      },
      error: (error: HttpErrorResponse) => {
        this.mensajePopup.set(
          this.textoError(error, 'No se pudo guardar el empleado.'),
        );
      },
    });
  }

  eliminar(empleado: Empleado): void {
    if (!confirm(`¿Eliminar al empleado ${empleado.nombre}?`)) return;

    this.http.delete(`${this.api}${empleado.id_empleado}`).subscribe({
      next: () => {
        this.cargar();
        this.mensaje.set('Empleado eliminado correctamente.');
      },
      error: (error: HttpErrorResponse) => {
        this.mensaje.set(
          this.textoError(error, 'No se pudo eliminar el empleado.'),
        );
      },
    });
  }

  private formularioVacio(): EmpleadoCreate {
    return { nombre: '', telefono: '', correo: '', cargo: '' };
  }

  private textoError(error: HttpErrorResponse, porDefecto: string): string {
    switch (error.status) {
      case HTTP_STATUS.SIN_CONEXION:
        return 'No hay conexión con el servidor. ¿Está encendido el backend?';
      case HTTP_STATUS.NO_ENCONTRADO:
        return typeof error.error?.detail === 'string'
          ? error.error.detail
          : 'No se encontró el registro.';
      case HTTP_STATUS.CONFLICTO:
        return 'Ese registro ya existe.';
      case HTTP_STATUS.DATOS_INVALIDOS:
        return 'Revisa los datos ingresados. Verifica los campos obligatorios y los UUID.';
      case HTTP_STATUS.ERROR_SERVIDOR:
        return 'El servidor no pudo completar la operación. Verifica los registros relacionados.';
      default:
        return porDefecto;
    }
  }
}
