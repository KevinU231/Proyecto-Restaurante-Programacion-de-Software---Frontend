export interface Usuario {
  id_usuario: string;
  id_empleado: string;
  nombre_usuario: string;
  primer_nombre: string;
  segundo_nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
}

export interface UsuarioCreate {
  id_empleado: string;
  nombre_usuario: string;
  primer_nombre: string;
  segundo_nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  clave: string;
  id_usuario_creacion?: string | null;
}

export interface UsuarioUpdate {
  id_usuario_edicion: string;
  nombre_usuario?: string;
  primer_nombre?: string;
  segundo_nombre?: string;
  primer_apellido?: string;
  segundo_apellido?: string;
  clave?: string;
}

/** Lo mínimo que se necesita de un empleado para elegirlo en una lista. */
export interface EmpleadoReferencia {
  id_empleado: string;
  nombre: string;
  cargo: string;
}
