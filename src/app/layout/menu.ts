export interface OpcionMenu {
  ruta: string;
  titulo: string;
  icono: string;
}

/**
 * Opciones del sidebar. Cada integrante agrega las suyas en su sección,
 * así los cambios no chocan al fusionar.
 */
export const MENU: OpcionMenu[] = [
  // --- Integrante A ---
  { ruta: 'usuarios', titulo: 'Usuarios', icono: '👤' },
  { ruta: 'clientes', titulo: 'Clientes', icono: '🧑' },
  { ruta: 'mesas', titulo: 'Mesas', icono: '🪑' },
  { ruta: 'reservas', titulo: 'Reservas', icono: '📅' },

  // --- Integrante B ---
  { ruta: 'empleados', titulo: 'Empleados', icono: '🧑‍🍳' },
  { ruta: 'pedidos', titulo: 'Pedidos', icono: '🧾' },
  { ruta: 'detalles-pedido', titulo: 'Detalles de pedido', icono: '🍽️' },
  { ruta: 'facturas', titulo: 'Facturas', icono: '💵' },

  // --- Integrante C ---
  { ruta: 'platos', titulo: 'Platos', icono: '🍲' },
  { ruta: 'menus', titulo: 'Menús', icono: '📖' },
  { ruta: 'inventarios', titulo: 'Inventario', icono: '📦' },
  { ruta: 'domicilios', titulo: 'Domicilios', icono: '🛵' },
];
