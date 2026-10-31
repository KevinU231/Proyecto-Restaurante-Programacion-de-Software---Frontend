
export interface DetallePedido {
  id_detalle_pedido: string;
  id_pedido: string;
  id_plato: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  id_usuario_creacion: string | null;
  fecha_creacion: string;
  id_usuario_edicion: string | null;
  fecha_edicion: string | null;
}

export interface DetallePedidoCreate {
  id_pedido: string;
  id_plato: string;
  cantidad: number;
  precio_unitario: number;
  id_usuario_creacion?: string | null;
}

export interface DetallePedidoUpdate {
  id_pedido?: string;
  id_plato?: string;
  cantidad?: number;
  precio_unitario?: number;
  id_usuario_edicion?: string | null;
}
