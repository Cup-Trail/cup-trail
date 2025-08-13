import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), ],
  resolve: {
    alias: {
      '@cuptrail/ui': '/packages/ui',
      '@cuptrail/data': '/packages/data'
    }
  }
});
