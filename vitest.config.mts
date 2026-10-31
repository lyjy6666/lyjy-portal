import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    // 只测纯逻辑（core/ 下的模块不依赖 DOM）
    environment: 'node',
    include: ['src/features/toolbox/**/*.test.ts'],
    reporters: 'default',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
