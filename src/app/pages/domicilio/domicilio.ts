import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomicilioService } from '../../services/domicilio.service';
import { Domicilio, DomicilioCreate } from '../../models/domicilio.model';

@Component({
  selector: 'app-domicilio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './domicilio.html'
})
export class DomicilioComponent implements OnInit {
  domicilios: Domicilio[] = [];
  nuevoDomicilio: DomicilioCreate = {
    id_pedido: '',
    direccion_entrega: '',
    estado_envio: 'Pendiente',
    costo_envio: 0
  };

  constructor(private domicilioService: DomicilioService) {}

  ngOnInit(): void {
    this.cargarDomicilios();
  }

  cargarDomicilios(): void {
    this.domicilioService.obtenerDomicilios().subscribe({
      next: (data) => this.domicilios = data,
      error: (err) => console.error('Error al cargar domicilios:', err)
    });
  }

  guardarDomicilio(): void {
    this.domicilioService.crearDomicilio(this.nuevoDomicilio).subscribe({
      next: () => {
        this.cargarDomicilios();
        this.nuevoDomicilio = { id_pedido: '', direccion_entrega: '', estado_envio: 'Pendiente', costo_envio: 0 };
      },
      error: (err) => console.error('Error al registrar domicilio:', err)
    });
  }
}