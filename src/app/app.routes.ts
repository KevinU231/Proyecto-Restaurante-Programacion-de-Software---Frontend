import { Routes } from '@angular/router';

import { Shell } from './layout/shell/shell';

// --- Integrante A ---
import { Clientes } from './pages/clientes/clientes';
import { Mesas } from './pages/mesas/mesas';
import { Reservas } from './pages/reservas/reservas';
import { Usuarios } from './pages/usuarios/usuarios';

// --- Integrante B ---
import { DetallesPedido } from './pages/detalles_pedido/detalle_pedido';
import { Empleados } from './pages/empleados/empleado';
import { Facturas } from './pages/facturas/factura';
import { Pedidos } from './pages/pedidos/pedido';

// --- Integrante C ---
import { DomicilioComponent } from './pages/domicilio/domicilio';
import { InventarioComponent } from './pages/inventario/inventario';
import { MenuComponent } from './pages/menu/menu';
import { PlatoComponent } from './pages/plato/plato';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'usuarios' },

      // --- Integrante A ---
      { path: 'usuarios', component: Usuarios },
      { path: 'clientes', component: Clientes },
      { path: 'mesas', component: Mesas },
      { path: 'reservas', component: Reservas },

      // --- Integrante B ---
      { path: 'empleados', component: Empleados },
      { path: 'pedidos', component: Pedidos },
      { path: 'detalles-pedido', component: DetallesPedido },
      { path: 'facturas', component: Facturas },

      // --- Integrante C ---
      { path: 'platos', component: PlatoComponent },
      { path: 'menus', component: MenuComponent },
      { path: 'inventarios', component: InventarioComponent },
      { path: 'domicilios', component: DomicilioComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];
