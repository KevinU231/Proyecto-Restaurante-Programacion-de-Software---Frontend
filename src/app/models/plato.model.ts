import { Inventario } from './inventario.model';

/** Versión corta del plato (la usan Menú y Domicilio dentro de su lista de platos). */
export interface PlatoSimple {
  id_plato: string;
  nombre: string;
  precio: number;
  descripcion: string;
}

/** Lo que devuelve el backend (PlatoRead): el plato con sus insumos. */
export interface Plato extends PlatoSimple {
  insumos: Inventario[];
}

/** Lo que se envía en el POST (PlatoCreate). */
export interface PlatoCreate {
  nombre: string;
  precio: number;
  descripcion: string;
  ids_insumos: string[];
  id_usuario_creacion: string;
}

/** Lo que se envía en el PUT (PlatoUpdate). */
export interface PlatoUpdate {
  nombre?: string;
  precio?: number;
  descripcion?: string;
  ids_insumos?: string[];
  id_usuario_edicion: string;
}
