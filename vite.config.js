import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // чтобы можно было открыть со телефона в локальной сети при тестировании
  },
  build: {
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      output: {
        // Библиотеки отдельно от кода игры: кэшируются между обновлениями, игра открывается быстрее.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory')) return 'charts';
          if (id.includes('lucide')) return 'icons';
          return 'vendor';
        },
      },
    },
  },
});
