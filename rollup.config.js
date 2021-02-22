import resolve from "rollup-plugin-node-resolve";
import typescript from 'rollup-plugin-typescript';
import commonjs from 'rollup-plugin-commonjs';
import css from 'rollup-plugin-css-only';

export default {
    input: './docs/index.ts',
    output: {
        file: './docs/example.min.js',
        name: 'bundle',
        format: 'iife',
    },
    plugins: [
        css(),
        typescript(),
        commonjs(),
        resolve(),
    ]
}
