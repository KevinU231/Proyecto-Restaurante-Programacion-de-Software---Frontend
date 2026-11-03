export interface Domicilio {
  id_domicilio: string;
  id_pedido: string;
  id_repartidor?: string | null;
  direccion_entrega: string;
  estado_envio: string;
  costo_envio: number;
  id_usuario_creacion?: string | null;
  id_usuario_edicion?: string | null;
  fecha_creacion?: string;
  fecha_edicion?: string | null;
}

export interface DomicilioCreate {
  id_pedido: string;
  id_repartidor?: string | null;
  direccion_entrega: string;
  estado_envio: string;
  costo_envio: number;
  id_usuario_creacion?: string | null;
}

export interface DomicilioUpdate {
  id_repartidor?: string | null;
  direccion_entrega?: string;
  estado_envio?: string;
  costo_envio?: number;
  id_usuario_edicion: string;
}