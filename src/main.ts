// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter, RouteReuseStrategy } from '@angular/router';
import { routes } from './app/app.routes';
import { CustomReuseStrategy } from './app/custom-reuse-strategy';
import { appConfig } from './app/app.config';


bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    ...(appConfig.providers || []),
    provideRouter(routes),
    { provide: RouteReuseStrategy, useClass: CustomReuseStrategy }
  ]
}).catch((err) => console.error(err));
