// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter, RouteReuseStrategy } from '@angular/router';
import { routes } from './app/app.routes';
import { CustomReuseStrategy } from './app/custom-reuse-strategy';
import { appConfig } from './app/app.config';
import { isDevMode } from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    ...(appConfig.providers || []),
    provideRouter(routes),
    { provide: RouteReuseStrategy, useClass: CustomReuseStrategy },

    // 🔥 Service Worker registration
    provideServiceWorker('combined-sw.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ]
}).catch((err) => console.error(err));
