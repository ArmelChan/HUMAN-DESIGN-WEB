import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// mode "artifact"：打包成單一 JS（不拆分延遲載入的模組），再由 scripts/inline-artifact.mjs 內嵌成單一 HTML。
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react()],
  build:
    mode === 'artifact'
      ? { outDir: 'dist-artifact', rollupOptions: { output: { inlineDynamicImports: true } } }
      : undefined,
  test: { globals: true, environment: 'node' },
}));
