import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuService } from '../../services/menu.service';
import { Menu, MenuCreate } from '../../models/menu.model';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menu.html'
})
export class MenuComponent implements OnInit {
  menus: Menu[] = [];
  nuevoMenu: MenuCreate = {
    nombre_menu: '',
    descripcion: '',
    disponible: true,
    fecha_inicio: null,
    fecha_fin: null
  };

  constructor(private menuService: MenuService) {}

  ngOnInit(): void {
    this.cargarMenus();
  }

  cargarMenus(): void {
    this.menuService.obtenerMenus().subscribe({
      next: (data) => this.menus = data,
      error: (err) => console.error('Error al cargar menús:', err)
    });
  }

  guardarMenu(): void {
    this.menuService.crearMenu(this.nuevoMenu).subscribe({
      next: () => {
        this.cargarMenus();
        this.nuevoMenu = {
          nombre_menu: '',
          descripcion: '',
          disponible: true,
          fecha_inicio: null,
          fecha_fin: null
        };
      },
      error: (err) => console.error('Error al crear menú:', err)
    });
  }
}