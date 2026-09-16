import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // чтобы можно было открыть со телефона в локальной сети при тестировании
  },
});
