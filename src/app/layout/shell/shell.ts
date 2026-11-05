import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { MENU } from '../menu';

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {
  readonly entidades = MENU;
  readonly retraido = signal(false);

  alternar(): void {
    this.retraido.update((valor) => !valor);
  }
}
