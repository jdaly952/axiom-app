import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            firebase: ['manualChunks: {
  vendor: ['react', 'react-dom'],
  firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
  genai: ['@google/genai'],
},'],
            genai: ['@google/genai'],
          },
        },
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      port: parseInt(process.env.PORT || '8080'),
    },
    preview: {
      port: parseInt(process.env.PORT || '8080'),
    },
  };
});