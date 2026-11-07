import { PlatoSimple } from './plato.model';

/** Lo que devuelve el backend (MenuRead): el menú con sus platos. */
export interface Menu {
  id_menu: string;
  nombre: string;
  descripcion: string;
  platos: PlatoSimple[];
}

/** Lo que se envía en el POST (MenuCreate). */
export interface MenuCreate {
  nombre: string;
  descripcion: string;
  ids_platos: string[];
  id_usuario_creacion: string;
}

/** Lo que se envía en el PUT (MenuUpdate). */
export interface MenuUpdate {
  nombre?: string;
  descripcion?: string;
  ids_platos?: string[];
  id_usuario_edicion: string;
}
