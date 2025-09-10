// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter, RouteReuseStrategy } from '@angular/router';
import { routes } from './app/app.routes';
import { CustomReuseStrategy } from './app/custom-reuse-strategy';
import { appConfig } from './app/app.config';
import { isDevMode, importProvidersFrom } from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';
import { provideHttpClient } from '@angular/common/http';
import { NgOptimizedImage } from '@angular/common';

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    ...(appConfig.providers || []),
    provideRouter(routes),
    { provide: RouteReuseStrategy, useClass: CustomReuseStrategy },

    // ✅ Needed for NgOptimizedImage
    provideHttpClient(),

    // ✅ Register NgOptimizedImage
    importProvidersFrom(NgOptimizedImage),

    // 🔥 Service Worker
    provideServiceWorker('combined-sw.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ]
}).catch((err) => console.error(err));
