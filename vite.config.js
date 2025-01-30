import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import obfuscator from 'rollup-plugin-obfuscator';

export default defineConfig({
  plugins: [
    vue(),
  ],
  build: {
    sourcemap: false,
    rollupOptions: {
      plugins: [
        obfuscator({
          compact: true,
          controlFlowFlattening: true,
          deadCodeInjection: true,
          debugProtection: true,
          debugProtectionInterval: true,
          stringArray: true,
          rotateStringArray: true,
          splitStrings: true,
          selfDefending: true,
        }),
      ],
    },
  },
  server: {
    port: 5173,
  },
});
