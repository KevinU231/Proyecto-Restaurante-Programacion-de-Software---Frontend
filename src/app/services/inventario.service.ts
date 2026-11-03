import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Inventario, InventarioCreate, InventarioUpdate } from '../models/inventario.model';

@Injectable({
  providedIn: 'root'
})
export class InventarioService {
  private apiUrl = 'http://localhost:8080/api/inventarios';

  constructor(private http: HttpClient) { }

  obtenerInventarios(): Observable<Inventario[]> {
    return this.http.get<Inventario[]>(this.apiUrl);
  }

  crearInventario(inventario: InventarioCreate): Observable<Inventario> {
    return this.http.post<Inventario>(this.apiUrl, inventario);
  }

  actualizarInventario(id: string, inventario: InventarioUpdate): Observable<Inventario> {
    return this.http.put<Inventario>(`${this.apiUrl}/${id}`, inventario);
  }

  eliminarInventario(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}