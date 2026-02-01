import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ['src'],
      exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'src/**/*.stories.tsx'],
      rollupTypes: true,
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'plugins/excel-import/index': resolve(__dirname, 'src/plugins/excel-import/index.ts'),
        'plugins/excel-export/index': resolve(__dirname, 'src/plugins/excel-export/index.ts'),
      },
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        '@tanstack/react-table',
        'react-window',
        'react-virtualized-auto-sizer',
        'date-fns',
        'date-fns-tz',
        'papaparse',
        'exceljs',
      ],
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        exports: 'named',
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
          '@tanstack/react-table': 'ReactTable',
          'react-window': 'ReactWindow',
          'date-fns': 'dateFns',
          'date-fns-tz': 'dateFnsTz',
          papaparse: 'Papa',
          exceljs: 'ExcelJS',
        },
      },
    },
    sourcemap: true,
    minify: false,
  },
});
