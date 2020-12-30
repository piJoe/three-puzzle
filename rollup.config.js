import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import scss from 'rollup-plugin-scss';

export default [{
    input: 'src/client/client.js',
    output: {
        file: 'dist/client/js/client.js',
        format: 'iife'
    },
    plugins: [commonjs(), resolve(), scss({
        // Filename to write all styles to
        output: 'dist/client/style/style.css',
    })]
}, {
    input: 'src/server/index.js',
    output: [
        {
            file: 'dist/server/server.js',
            format: 'cjs'
        },
    ],
    plugins: [commonjs(), resolve()]
}];