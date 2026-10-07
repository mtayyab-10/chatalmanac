import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'esbuild',
    // Source maps in production would expose source — disable
    sourcemap: false,
    rollupOptions: {
      input: {
        main: './index.html',
        sw: './src/sw.ts',
      },
      output: {
        // The service worker chunk must sit at the root so its scope covers /
        entryFileNames: (info) =>
          info.name === 'sw' ? '[name].js' : 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },

  server: {
    port: 5173,
    strictPort: true,
    headers: {
      // Development CSP — allows HMR websocket, self-fetch, and worker blobs
      'Content-Security-Policy':
        "default-src 'self'; connect-src 'self'; worker-src 'self' blob:; frame-src 'none'; object-src 'none'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' blob:",
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
    },
  },

  // Preview server — mirrors production headers for local testing
  preview: {
    port: 4173,
    headers: {
      'Content-Security-Policy':
        "default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'none'; worker-src 'self' blob:; manifest-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'none';",
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'same-origin',
    },
  },

  // Web Worker bundles — emitted as ES module files in production
  worker: {
    format: 'es',
  },

  // Vitest
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
