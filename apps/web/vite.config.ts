import tailwindcss from '@tailwindcss/vite';
import path from 'path';

import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [reactRouter(), tailwindcss()],
  envPrefix: ['VITE_', 'EXPO_PUBLIC_'],
  // Fixed, uncommon dev port so it never collides with other servers and always
  // matches the passkey relying-party origin. strictPort fails loudly rather
  // than drifting to another port the RP origin wouldn't match.
  server: { port: 33718, strictPort: true },
  resolve: {
    alias: {
      '@cuptrail/core': path.resolve(__dirname, '../../packages/core'),
      '@cuptrail/utils': path.resolve(__dirname, '../../packages/utils'),
      '@cuptrail/maps': path.resolve(__dirname, '../../packages/maps'),
      '@utils': path.resolve(__dirname, './app/utils'),
      '@components': path.resolve(__dirname, './app/components'),
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
