// src/app/services/telegram.service.ts
import { Injectable } from '@angular/core';
import { RequestDataService } from './http-loader/request-data.service';


declare global {
  interface Navigator {
    standalone?: boolean;
  }
}

@Injectable({ providedIn: 'root' })
export class TelegramService {
  private botUsername = 'MenassportBot';  // Replace with your bot username (without @)

  constructor(private http: RequestDataService) {}

  isIOS() {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  isInStandaloneMode() {
    // iOS PWA check: window.navigator.standalone is true when "Add to Home Screen" app is launched
    return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  }

  connect() {
    // Open a blank window immediately when the user clicks
    const newWindow = window.open('', '_blank');

    this.http.post('generate-token/', {}).subscribe({
      next: (res) => {
        const bindToken = res.bind_token;
        const telegramUrl = `https://t.me/${this.botUsername}?start=${bindToken}`;

        if (newWindow) {
          // Usage example:
          if (this.isIOS() && this.isInStandaloneMode()) {
            // iOS + PWA
            newWindow.location.href = telegramUrl; // Redirect in same window
          } else if (this.isIOS()) {
            // iOS + Safari browser
            window.location.href = telegramUrl; // Normal redirect
          } else {
            // Android or desktop
            window.open(telegramUrl, '_blank'); // Open in new tab
          }
        }


        // if ("ios") {
        //   // Redirect the opened window to Telegram
        //   newWindow.location.href = telegramUrl;
        // } else {
        //   // Fallback: open in same tab if popup was blocked
        //   window.open(telegramUrl, '_blank')
        // }
      },
      error: () => {
        if (newWindow) newWindow.close();
      }
    });
  }
}
