import { defineConfig } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';

export default defineConfig({
  input: [
    './src/index.js',
  ],
  output: [
    {
      format: 'cjs',
      file: './dist/index.js',
      plugins: [
        terser(),
      ],
    },
    {
      dir: './lib',
      format: 'cjs',
      exports: 'named',
      preserveModules: true,
      preserveModulesRoot: 'src'
    },
    {
      dir: './es',
      format: 'es',
      exports: 'named',
      preserveModules: true,
      preserveModulesRoot: 'src'
    },
  ],
  external: [
    /@babel\/runtime/,
    /axios/,
  ],
  plugins: [
    resolve(),   // resolve third-party modules
    babel({
      exclude: 'node_modules/**',
      babelHelpers: 'runtime',
    }),
    json(),      // support JSON files
    commonjs(),
  ],
});
