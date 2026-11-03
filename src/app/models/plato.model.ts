export interface Plato {
  id_plato: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  disponible: boolean;
  imagen?: string | null;
  id_usuario_creacion?: string | null;
  id_usuario_edicion?: string | null;
  fecha_creacion?: string;
  fecha_edicion?: string | null;
}

export interface PlatoCreate {
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  disponible: boolean;
  imagen?: string | null;
  id_usuario_creacion?: string | null;
}

export interface PlatoUpdate {
  nombre?: string;
  descripcion?: string;
  precio?: number;
  categoria?: string;
  disponible?: boolean;
  imagen?: string | null;
  id_usuario_edicion: string;
}