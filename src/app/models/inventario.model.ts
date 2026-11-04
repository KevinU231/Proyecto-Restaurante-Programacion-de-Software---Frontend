export interface Inventario {
  id_inventario: string;
  nombre_item: string;
  cantidad_stock: number;
  unidad_medida: string;
  stock_minimo: number;
  id_usuario_creacion?: string | null;
  id_usuario_edicion?: string | null;
  fecha_creacion?: string;
  fecha_edicion?: string | null;
}

export interface InventarioCreate {
  nombre_item: string;
  cantidad_stock: number;
  unidad_medida: string;
  stock_minimo: number;
  id_usuario_creacion?: string | null;
}

export interface InventarioUpdate {
  nombre_item?: string;
  cantidad_stock?: number;
  unidad_medida?: string;
  stock_minimo?: number;
  id_usuario_edicion: string;
}