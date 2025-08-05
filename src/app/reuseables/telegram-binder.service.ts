// src/app/services/telegram.service.ts
import { Injectable } from '@angular/core';
import { RequestDataService } from './http-loader/request-data.service';

@Injectable({ providedIn: 'root' })
export class TelegramService {
  private botUsername = 'MenassportBot';  // Replace with your bot username (without @)

  constructor(private http: RequestDataService) {}

  connect() {
    // Open a blank window immediately when the user clicks
    const newWindow = window.open('', '_blank');

    this.http.post('generate-token/', {}).subscribe({
      next: (res) => {
        const bindToken = res.bind_token;
        const telegramUrl = `https://t.me/${this.botUsername}?start=${bindToken}`;

        if (newWindow) {
          // Redirect the opened window to Telegram
          newWindow.location.href = telegramUrl;
        } else {
          // Fallback: open in same tab if popup was blocked
          window.location.href = telegramUrl;
        }
      },
      error: () => {
        if (newWindow) newWindow.close();
      }
    });
  }
}
