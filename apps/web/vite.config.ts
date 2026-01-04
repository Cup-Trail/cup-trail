import path from 'path';
import tailwindcss from '@tailwindcss/vite';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react(), tailwindcss()],
  envPrefix: ['VITE_', 'EXPO_PUBLIC_'],
  resolve: {
    alias: {
      '@cuptrail/core': path.resolve(__dirname, '../../packages/core'),
      '@cuptrail/utils': path.resolve(__dirname, '../../packages/utils'),
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
