import { PlatoSimple } from './plato.model';

/** Lo que devuelve el backend (DomicilioRead): el domicilio con sus platos. */
export interface Domicilio {
  id_domicilio: string;
  id_cliente: string;
  direccion_entrega: string;
  estado: string;
  platos: PlatoSimple[];
}

/** Lo que se envía en el POST (DomicilioCreate). */
export interface DomicilioCreate {
  id_cliente: string;
  direccion_entrega: string;
  ids_platos: string[];
  id_usuario_creacion: string;
  estado: string;
}

/** Lo que se envía en el PUT (DomicilioUpdate). El cliente no se puede cambiar. */
export interface DomicilioUpdate {
  direccion_entrega?: string;
  ids_platos?: string[];
  estado?: string;
  id_usuario_edicion: string;
}
