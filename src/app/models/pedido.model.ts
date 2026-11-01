
export interface Pedido {
  id_pedido: string;
  id_empleado: string;
  id_cliente: string;
  id_mesa: string | null;
  estado: string;
  total: number;
  id_usuario_creacion: string | null;
  id_usuario_edicion: string | null;
  fecha_creacion: string;
  fecha_edicion: string | null;
}

export interface PedidoCreate {
  id_empleado: string;
  id_cliente: string;
  id_mesa?: string | null;
  estado: string;
  total: number;
  id_usuario_creacion?: string | null;
}

export interface PedidoUpdate {
  id_empleado?: string;
  id_cliente?: string;
  id_mesa?: string | null;
  estado?: string;
  total?: number;
  id_usuario_edicion: string;
}
