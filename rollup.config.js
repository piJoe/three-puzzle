import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import scss from 'rollup-plugin-scss';
import includePaths from "rollup-plugin-includepaths";
import copy from 'rollup-plugin-copy';

const includePathOptions = {
    include: {},
    paths: ['src/'],
    external: [],
    extensions: ['.js', '.json']
};

export default [{
    input: 'src/client/client.js',
    output: {
        file: 'dist/client/js/client.js',
        format: 'iife',
        compact: true,
        sourcemap: true,
    },
    plugins: [copy({
        targets: [
            { src: 'resources/**/*', dest: 'dist/client/resources' }
        ]
    }),
    includePaths(includePathOptions),
    commonjs(),
    resolve(),
    scss({
        // Filename to write all styles to
        output: 'dist/client/style/style.css',
    })]
}, {
    input: 'src/server/index.js',
    output:
    {
        file: 'dist/server/server.js',
        format: 'cjs',
        sourcemap: true,
    },
    plugins: [includePaths(includePathOptions), commonjs(), resolve()]
}];