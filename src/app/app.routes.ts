
import { Routes } from '@angular/router';

import { Shell } from './layout/shell/shell';
import { Usuarios } from './pages/usuarios/usuarios';
import { Empleados } from './pages/empleados/empleado';
import { Pedidos } from './pages/pedidos/pedido';
import { DetallesPedido } from './pages/detalles_pedido/detalle_pedido';
import { Facturas } from './pages/facturas/factura';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'usuarios' },
      { path: 'usuarios', component: Usuarios },
      { path: 'empleados', component: Empleados },
      { path: 'pedidos', component: Pedidos },
      { path: 'detalles-pedido', component: DetallesPedido },
      { path: 'facturas', component: Facturas },
    ],
  },
  { path: '**', redirectTo: '' },
];
