export interface Cliente {
  id_cliente: string;
  nombre: string;
  telefono: string;
  correo: string;
  direccion: string;
}

export interface ClienteCreate {
  nombre: string;
  telefono: string;
  correo: string;
  direccion: string;
  id_usuario_creacion: string;
}

export interface ClienteUpdate {
  id_usuario_edicion: string;
  nombre?: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
}
