import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';

export default [{
    input: 'src/client/client.js',
    output: {
        file: 'dist/client/js/client.js',
        format: 'iife'
    },
    plugins: [ commonjs(), resolve() ]
}, {
    input: 'src/server/index.js',
    output: [
        {
            file: 'dist/server/server.js',
            format: 'cjs'
        },
    ],
    plugins: [ commonjs(), resolve() ]
}];