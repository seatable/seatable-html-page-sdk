import { defineConfig } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';

export default defineConfig([
  {
    input: './src/index.umd.js',
    output: [
      {
        format: 'umd',
        file: './dist/index.js',
        name: 'HTMLPageSDK',
        exports: 'default',
        sourcemap: true,
      },
      {
        format: 'umd',
        file: './dist/index.min.js',
        name: 'HTMLPageSDK',
        exports: 'default',
        sourcemap: true,
        plugins: [terser()],
      }
    ],
    plugins: [
      resolve({ browser: true }),
      babel({
        exclude: 'node_modules/**',
        babelHelpers: 'bundled',
        presets: [
          ['@babel/preset-env', {
            targets: '> 0.25%, not dead',
            modules: false,
          }]
        ]
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
        sourcemap: true,
      },
      {
        dir: './es',
        format: 'es',
        exports: 'named',
        preserveModules: true,
        preserveModulesRoot: 'src',
        sourcemap: true,
      },
    ],
    external: [
      /axios/,
      /node_modules/,
    ],
    plugins: [
      resolve(), // resolve third-party modules
      babel({
        exclude: 'node_modules/**',
        babelHelpers: 'bundled',
        presets: [
          ['@babel/preset-env', {
            targets: '> 0.25%, not dead',
            modules: false,
          }]
        ],
      }),
      json(), // support JSON files
      commonjs(),
    ],
  }
]);
