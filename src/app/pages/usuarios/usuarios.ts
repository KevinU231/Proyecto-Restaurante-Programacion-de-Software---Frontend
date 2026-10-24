import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { HTTP_STATUS } from '../../constants/http-status';
import { Usuario, UsuarioCreate, UsuarioUpdate } from '../../models/usuario.model';
import { UsuarioService } from '../../services/usuario.service';

type Modo = 'crear' | 'editar';

@Component({
  selector: 'app-usuarios',
  imports: [FormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class Usuarios implements OnInit {
  private readonly servicio = inject(UsuarioService);

  readonly usuarios = signal<Usuario[]>([]);
  readonly cargando = signal(false);
  readonly mensaje = signal('');
  readonly mensajePopup = signal('');
  readonly popupAbierto = signal(false);
  readonly modo = signal<Modo>('crear');

  idFiltro = '';
  formulario: UsuarioCreate = this.formularioVacio();
  private idEnEdicion = '';

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.mensaje.set('');
    this.servicio.listar().subscribe({
      next: (respuesta) => {
        this.usuarios.set(respuesta.data ?? []);
        this.cargando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.usuarios.set([]);
        this.cargando.set(false);
        this.mensaje.set(
          error.status === HTTP_STATUS.NO_ENCONTRADO
            ? 'No hay usuarios registrados.'
            : this.textoError(error, 'No se pudieron cargar los usuarios.'),
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
    this.servicio.obtener(id).subscribe({
      next: (usuario) => {
        this.usuarios.set([usuario]);
        this.cargando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.usuarios.set([]);
        this.cargando.set(false);
        this.mensaje.set(this.textoError(error, 'No se pudo buscar el usuario.'));
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

  abrirEditar(usuario: Usuario): void {
    this.formulario = {
      id_empleado: usuario.id_empleado,
      nombre_usuario: usuario.nombre_usuario,
      primer_nombre: usuario.primer_nombre,
      segundo_nombre: usuario.segundo_nombre,
      primer_apellido: usuario.primer_apellido,
      segundo_apellido: usuario.segundo_apellido,
      clave: '',
    };
    this.idEnEdicion = usuario.id_usuario;
    this.mensajePopup.set('');
    this.modo.set('editar');
    this.popupAbierto.set(true);
  }

  cerrarPopup(): void {
    this.popupAbierto.set(false);
  }

  guardar(): void {
    if (!this.formularioValido()) {
      this.mensajePopup.set(
        'Completa nombre, apellido y usuario. Al crear también la clave y el ID del empleado.',
      );
      return;
    }
    this.mensajePopup.set('');

    const peticion =
      this.modo() === 'crear'
        ? this.servicio.crear(this.datosCreacion())
        : this.servicio.actualizar(this.idEnEdicion, this.datosEdicion());

    peticion.subscribe({
      next: (respuesta) => {
        this.cerrarPopup();
        this.cargar();
        this.mensaje.set(respuesta.message);
      },
      error: (error: HttpErrorResponse) => {
        this.mensajePopup.set(this.textoError(error, 'No se pudo guardar el usuario.'));
      },
    });
  }

  eliminar(usuario: Usuario): void {
    if (!confirm(`¿Eliminar al usuario ${usuario.nombre_usuario}?`)) {
      return;
    }
    this.servicio.eliminar(usuario.id_usuario).subscribe({
      next: () => {
        this.cargar();
        this.mensaje.set('Usuario eliminado.');
      },
      error: (error: HttpErrorResponse) => {
        this.mensaje.set(this.textoError(error, 'No se pudo eliminar el usuario.'));
      },
    });
  }

  private formularioVacio(): UsuarioCreate {
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

  private formularioValido(): boolean {
    const f = this.formulario;
    const basicos = Boolean(
      f.primer_nombre.trim() && f.primer_apellido.trim() && f.nombre_usuario.trim(),
    );
    if (this.modo() === 'editar') {
      return basicos;
    }
    return basicos && Boolean(f.clave.trim() && f.id_empleado.trim());
  }

  private datosCreacion(): UsuarioCreate {
    const f = this.formulario;
    return {
      id_empleado: f.id_empleado.trim(),
      nombre_usuario: f.nombre_usuario.trim(),
      primer_nombre: f.primer_nombre.trim(),
      segundo_nombre: f.segundo_nombre.trim(),
      primer_apellido: f.primer_apellido.trim(),
      segundo_apellido: f.segundo_apellido.trim(),
      clave: f.clave,
    };
  }

  private datosEdicion(): UsuarioUpdate {
    const f = this.formulario;
    const datos: UsuarioUpdate = {
      nombre_usuario: f.nombre_usuario.trim(),
      primer_nombre: f.primer_nombre.trim(),
      segundo_nombre: f.segundo_nombre.trim(),
      primer_apellido: f.primer_apellido.trim(),
      segundo_apellido: f.segundo_apellido.trim(),
    };
    if (f.clave.trim()) {
      datos.clave = f.clave;
    }
    return datos;
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
        return 'Revisa los datos: los IDs deben ser UUID válidos y los campos obligatorios no pueden ir vacíos.';
      case HTTP_STATUS.ERROR_SERVIDOR:
        return 'El servidor no pudo completar la operación. Puede que el registro esté en uso, que el ID del empleado no exista o que el usuario ya exista.';
      default:
        return porDefecto;
    }
  }
}
