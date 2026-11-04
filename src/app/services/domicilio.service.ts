import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Domicilio, DomicilioCreate, DomicilioUpdate } from '../models/domicilio.model';

@Injectable({
  providedIn: 'root'
})
export class DomicilioService {
  private apiUrl = 'http://localhost:8080/api/domicilios';

  constructor(private http: HttpClient) { }

  obtenerDomicilios(): Observable<Domicilio[]> {
    return this.http.get<Domicilio[]>(this.apiUrl);
  }

  crearDomicilio(domicilio: DomicilioCreate): Observable<Domicilio> {
    return this.http.post<Domicilio>(this.apiUrl, domicilio);
  }

  actualizarDomicilio(id: string, domicilio: DomicilioUpdate): Observable<Domicilio> {
    return this.http.put<Domicilio>(`${this.apiUrl}/${id}`, domicilio);
  }

  eliminarDomicilio(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}