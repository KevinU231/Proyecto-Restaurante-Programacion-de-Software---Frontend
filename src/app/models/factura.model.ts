
export interface Factura {
  id_factura: string;
  id_pedido: string;
  fecha_factura: string;
  metodo_pago: string;
  total: number;
  id_usuario_creacion: string | null;
  fecha_creacion: string;
  id_usuario_edicion: string | null;
  fecha_edicion: string | null;
}

export interface FacturaCreate {
  id_pedido: string;
  metodo_pago: string;
  total: number;
  id_usuario_creacion?: string | null;
}

export interface FacturaUpdate {
  id_pedido?: string;
  metodo_pago?: string;
  total?: number;
  id_usuario_edicion?: string | null;
}
