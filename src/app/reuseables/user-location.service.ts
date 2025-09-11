// src/app/reuseables/user-location.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserLocationService {
  private readonly API_KEY = '036b088a9200482c9708dae0635fcfeb';

  constructor(private http: HttpClient) {}

  async getLocation(): Promise<{ country: string; code: string; flag: string; currency: string }> {
    const url = `https://api.ipgeolocation.io/ipgeo?apiKey=${this.API_KEY}&fields=country_name,country_code2,country_flag,currency`;

    try {
      const resp: any = await firstValueFrom(this.http.get(url));
      return {
        country: resp.country_name ?? 'Unknown',
        code: resp.country_code2 ?? '',
        flag: resp.country_flag ?? '',
        currency: resp.currency?.code ?? ''   // 👈 currency code (e.g. NGN, USD)
      };
    } catch (err) {
      console.error('Failed to fetch location', err);
      return {
        country: 'Unknown',
        code: '',
        flag: '',
        currency: ''
      };
    }
  }
}
