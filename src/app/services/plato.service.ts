import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PlatoService {
  // Ajusta la URL de tu API backend si es diferente
  private apiUrl = 'http://localhost:8000/api/platos'; 

  constructor(private http: HttpClient) {}

  obtenerPlatos(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  crearPlato(plato: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, plato);
  }
}