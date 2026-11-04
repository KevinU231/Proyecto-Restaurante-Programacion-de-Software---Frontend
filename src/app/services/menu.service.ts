import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Menu, MenuCreate, MenuUpdate } from '../models/menu.model';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private apiUrl = 'http://localhost:8080/api/menus';

  constructor(private http: HttpClient) { }

  obtenerMenus(): Observable<Menu[]> {
    return this.http.get<Menu[]>(this.apiUrl);
  }

  crearMenu(menu: MenuCreate): Observable<Menu> {
    return this.http.post<Menu>(this.apiUrl, menu);
  }

  actualizarMenu(id: string, menu: MenuUpdate): Observable<Menu> {
    return this.http.put<Menu>(`${this.apiUrl}/${id}`, menu);
  }

  eliminarMenu(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}