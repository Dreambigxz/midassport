import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { finalize, Observable } from 'rxjs';
import { LoaderService } from './loader.service';
import { AuthService } from '../auth/auth.service'

@Injectable({ providedIn: 'root' })
export class RequestDataService {
  private baseUrl = 'http://127.0.0.1:8000/api'; // Replace with your API endpoint
  // private baseUrl = 'https://fbapp01-125e9985037c.herokuapp.com/api'; // Replace with your API endpoint
// dfg
  constructor(
    private http: HttpClient,
    private loader: LoaderService,
    private authService: AuthService
  ) {}

  get(endpoint: string): Observable<any> {
      return this.http.get(`${this.baseUrl}/${endpoint}`).pipe(
    );
  }

  post(endpoint: string, data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/${endpoint}`, data);
  }

}
