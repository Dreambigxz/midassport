

import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient,withInterceptors } from '@angular/common/http';
import { PostHttpInterceptor } from './reuseables/http-loader/post-http.interceptor';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
// import { FormsModule } from '@angular/forms';
// import { importProvidersFrom } from '@angular/core';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideHttpClient(withInterceptors([PostHttpInterceptor])),
    provideNoopAnimations(),
    // importProvidersFrom(FormsModule)  // ✅ This is the fix


  ]
};
