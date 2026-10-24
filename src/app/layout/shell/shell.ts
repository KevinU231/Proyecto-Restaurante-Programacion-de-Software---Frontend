import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

interface OpcionMenu {
  ruta: string;
  etiqueta: string;
}

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {
  // Para agregar una pantalla: crea su página, su ruta en app.routes.ts y una línea aquí.
  readonly menu: OpcionMenu[] = [{ ruta: '/usuarios', etiqueta: 'Usuarios' }];
}
