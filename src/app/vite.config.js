import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular'; // if you’re using AnalogJS or Angular+Vite

export default defineConfig({
  plugins: [angular()],
  server: {
    allowedHosts: [
      '11529755dc31.ngrok-free.app' // replace with your actual ngrok subdomain
    ]
  }
});
