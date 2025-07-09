import {environment} from '../../environments/environment';
import {Injectable} from '@angular/core';
import {BehaviorSubject, catchError, map, Observable, of, tap} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {UserService} from './user.service';

@Injectable({ providedIn: 'root'})
export class ImportService {
  private endpoint = `${environment.backend.baseURL}/api/imports`;

  constructor(private http: HttpClient) { }

  getImports(): Observable<any[]> {
    return this.http.get<any[]>(`${this.endpoint}`);
  }

  getImport(id: string): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/${id}`);
  }

  deleteImport(id: string): Observable<any> {
    return this.http.delete<any>(`${this.endpoint}/${id}`);
  }
}
