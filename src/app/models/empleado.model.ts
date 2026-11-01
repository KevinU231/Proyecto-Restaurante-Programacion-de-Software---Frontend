
export interface Empleado {
  id_empleado: string;
  nombre: string;
  telefono: string;
  correo: string;
  cargo: string;
  id_usuario_creacion: string | null;
  fecha_creacion: string;
  id_usuario_edicion: string | null;
  fecha_edicion: string | null;
}

export interface EmpleadoCreate {
  nombre: string;
  telefono: string;
  correo: string;
  cargo: string;
  id_usuario_creacion?: string | null;
}

export interface EmpleadoUpdate {
  nombre?: string;
  telefono?: string;
  correo?: string;
  cargo?: string;
  id_usuario_edicion?: string | null;
}
