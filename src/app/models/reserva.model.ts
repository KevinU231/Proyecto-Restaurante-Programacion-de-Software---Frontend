export interface Reserva {
  id_reserva: string;
  id_cliente: string;
  id_mesa: string;
  fecha: string;
  hora: string;
  num_personas: number;
  estado: string;
}

export interface ReservaCreate {
  id_cliente: string;
  id_mesa: string;
  fecha: string;
  hora: string;
  num_personas: number;
  estado: string;
  id_usuario_creacion: string;
}

export interface ReservaUpdate {
  id_usuario_edicion: string;
  fecha?: string;
  hora?: string;
  num_personas?: number;
  estado?: string;
}
