import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventarioService } from '../../services/inventario.service';
import { Inventario, InventarioCreate } from '../../models/inventario.model';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventario.html'
})
export class InventarioComponent implements OnInit {
  inventarios: Inventario[] = [];
  nuevoItem: InventarioCreate = {
    nombre_item: '',
    cantidad_stock: 0,
    unidad_medida: 'Kg',
    stock_minimo: 5
  };

  constructor(private inventarioService: InventarioService) {}

  ngOnInit(): void {
    this.cargarInventario();
  }

  cargarInventario(): void {
    this.inventarioService.obtenerInventarios().subscribe({
      next: (data) => this.inventarios = data,
      error: (err) => console.error('Error al cargar inventario:', err)
    });
  }

  guardarItem(): void {
    this.inventarioService.crearInventario(this.nuevoItem).subscribe({
      next: () => {
        this.cargarInventario();
        this.nuevoItem = { nombre_item: '', cantidad_stock: 0, unidad_medida: 'Kg', stock_minimo: 5 };
      },
      error: (err) => console.error('Error al crear item de inventario:', err)
    });
  }
}