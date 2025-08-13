import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@cuptrail/data': path.resolve(__dirname, '../../packages/data'),
    },
    extensions: [
      '.web.tsx',
      '.web.ts',
      '.web.jsx',
      '.web.js', 
      '.ts',
      '.tsx',
      '.js',
      '.jsx',
      '.json',
    ],
  },
});
