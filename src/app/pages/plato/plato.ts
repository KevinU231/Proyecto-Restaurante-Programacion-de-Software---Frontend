import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlatoService } from '../../services/plato.service';
import { Plato, PlatoCreate } from '../../models/plato.model';

@Component({
  selector: 'app-plato',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './plato.html'
})
export class PlatoComponent implements OnInit {
  platos: Plato[] = [];
  nuevoPlato: PlatoCreate = {
    nombre: '',
    descripcion: '',
    precio: 0,
    categoria: 'Plato Fuerte',
    disponible: true
  };

  constructor(private platoService: PlatoService) {}

  ngOnInit(): void {
    this.cargarPlatos();
  }

  cargarPlatos(): void {
    this.platoService.obtenerPlatos().subscribe({
      next: (data: Plato[]) => this.platos = data,
      error: (err: any) => console.error('Error al cargar platos:', err)
    });
  }

  guardarPlato(): void {
    this.platoService.crearPlato(this.nuevoPlato).subscribe({
      next: () => {
        this.cargarPlatos();
        this.nuevoPlato = { nombre: '', descripcion: '', precio: 0, categoria: 'Plato Fuerte', disponible: true };
      },
      error: (err: any) => console.error('Error al crear plato:', err)
    });
  }
}