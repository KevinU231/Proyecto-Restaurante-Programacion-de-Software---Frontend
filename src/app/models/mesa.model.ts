export interface Mesa {
  id_mesa: string;
  numero: number;
  capacidad: number;
  estado: string;
}

export interface MesaCreate {
  numero: number;
  capacidad: number;
  estado: string;
  id_usuario_creacion: string;
}

export interface MesaUpdate {
  id_usuario_edicion: string;
  numero?: number;
  capacidad?: number;
  estado?: string;
}
