import { defineConfig } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';

export default defineConfig([
  {
    input: './src/index.umd.js',
    output: {
      format: 'umd',
      file: './dist/index.js',
      name: 'HTMLPageSDK',
      exports: 'default',
      plugins: [terser()],
    },
    plugins: [
      resolve({ browser: true }),
      babel({
        exclude: 'node_modules/**',
        babelHelpers: 'runtime',
        presets: ['@babel/preset-env']
      }),
      json(),
      commonjs(),
    ],
  },
  {
    input: [
      './src/index.js',
    ],
    output: [
      {
        dir: './lib',
        format: 'cjs',
        exports: 'named',
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
      {
        dir: './es',
        format: 'es',
        exports: 'named',
        preserveModules: true,
        preserveModulesRoot: 'src',
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
  }
]);
