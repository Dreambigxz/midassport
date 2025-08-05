// src/app/services/telegram.service.ts
import { Injectable,inject } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
import { RequestDataService } from './http-loader/request-data.service';

@Injectable({ providedIn: 'root' })
export class TelegramService {
  private botUsername = 'MenassportBot';  // Replace with your bot username (without @)

  constructor(private http: RequestDataService) {}

  connect() {
    this.http.post('generate-token/', {}).subscribe({
      next: (res) => {
        const bindToken = res.bind_token;
        const telegramUrl = `https://t.me/${this.botUsername}?start=${bindToken}`;
        window.open(telegramUrl);
      },

    });
  }
}
