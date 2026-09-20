import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// allowedHosts: true — чтобы приложение открывалось через временный HTTPS-адрес для Telegram
export default defineConfig({
  // base: './' — чтобы сборка работала из подпапки на GitHub Pages
  base: './',
  plugins: [react()],
  server: { host: true, port: 5173, allowedHosts: true },
  preview: { host: true, port: 4173, allowedHosts: true },
});
