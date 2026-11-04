export interface Menu {
  id_menu: string;
  nombre_menu: string;
  descripcion: string;
  disponible: boolean;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  id_usuario_creacion?: string | null;
  id_usuario_edicion?: string | null;
  fecha_creacion?: string;
  fecha_edicion?: string | null;
}

export interface MenuCreate {
  nombre_menu: string;
  descripcion: string;
  disponible: boolean;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  id_usuario_creacion?: string | null;
}

export interface MenuUpdate {
  nombre_menu?: string;
  descripcion?: string;
  disponible?: boolean;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  id_usuario_edicion: string;
}