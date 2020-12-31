import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import scss from 'rollup-plugin-scss';
import typescript from "@rollup/plugin-typescript";

export default [{
    input: 'src/client/client.ts',
    output: {
        file: 'dist/client/js/client.js',
        format: 'iife',
        compact: true,
        sourcemap: true,
    },
    plugins: [commonjs(), typescript(), resolve(), scss({
        // Filename to write all styles to
        output: 'dist/client/style/style.css',
    })]
}, {
    input: 'src/server/index.ts',
    output: 
    {
        file: 'dist/server/server.js',
        format: 'cjs',
        sourcemap: true,
    },
    plugins: [commonjs(), typescript(), resolve()]
}];