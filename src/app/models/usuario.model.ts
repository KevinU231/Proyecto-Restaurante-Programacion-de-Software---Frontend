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
}

export interface UsuarioUpdate {
  nombre_usuario?: string;
  primer_nombre?: string;
  segundo_nombre?: string;
  primer_apellido?: string;
  segundo_apellido?: string;
  clave?: string;
}
