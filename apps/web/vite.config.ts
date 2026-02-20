import tailwindcss from '@tailwindcss/vite';
import path from 'path';

import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [reactRouter(), tailwindcss()],
  envPrefix: ['VITE_', 'EXPO_PUBLIC_'],
  resolve: {
    alias: {
      '@cuptrail/core': path.resolve(__dirname, '../../packages/core'),
      '@cuptrail/utils': path.resolve(__dirname, '../../packages/utils'),
      '@cuptrail/maps-api': path.resolve(__dirname, '../../packages/maps-api'),
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
