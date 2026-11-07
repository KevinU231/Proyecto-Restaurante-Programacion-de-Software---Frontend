/** Lo que devuelve el backend (InventarioRead). */
export interface Inventario {
  id_insumo: string;
  nombre_insumo: string;
  cantidad: number;
  unidad_medida: string;
}

/** Lo que se envía en el POST (InventarioCreate). */
export interface InventarioCreate {
  nombre_insumo: string;
  cantidad: number;
  unidad_medida: string;
  id_usuario_creacion: string;
}

/** Lo que se envía en el PUT (InventarioUpdate). */
export interface InventarioUpdate {
  nombre_insumo?: string;
  cantidad?: number;
  unidad_medida?: string;
  id_usuario_edicion: string;
}
