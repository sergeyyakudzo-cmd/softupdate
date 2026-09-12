const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
    const isDev = argv.mode === 'development';

    return {
        target: 'web',
        devtool: isDev ? 'source-map' : false,

        entry: {
            background: './background/index.js',
            content: './content/index.js',
            popup: './popup/index.js',
        },

        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: '[name].js',
            clean: true,
        },

        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                ['@babel/preset-env', {
                                    targets: { chrome: 100 },
                                    modules: false,
                                }]
                            ],
                            compact: false,
                        }
                    }
                }
            ]
        },

        plugins: [
            new CopyPlugin({
                patterns: [
                    {
                        from: '.',
                        to: '.',
                        filter: (resourcePath) => {
                            const rel = path.relative(__dirname, resourcePath);
                            if (rel.startsWith('node_modules') || rel.startsWith('dist') ||
                                rel.startsWith('.continue') || rel === 'popup' ||
                                rel.startsWith('popup\\') || rel.startsWith('popup/') ||
                                rel.startsWith('background\\') || rel.startsWith('background/') ||
                                rel.startsWith('content\\') || rel.startsWith('content/')) return false;
                            if (/\.d\.ts$/.test(rel)) return false;
                            if (/^package(-lock)?\.json$/.test(rel) || rel === 'tsconfig.json' ||
                                rel === 'webpack.config.js' || rel === '.gitignore' ||
                                rel === 'version.txt' || rel === 'background.js' ||
                                rel === 'popup.js' || rel === 'background.js.map' ||
                                /^content-/.test(rel) || rel === 'content.js' ||
                                rel === 'eslint.config.js' || rel === '.prettierrc' ||
                                rel === '.eslintrc.json') return false;
                            return true;
                        },
                        noErrorOnMissing: true,
                    },
                ],
            }),
            new CopyPlugin({
                patterns: [
                    {
                        from: 'manifest.json',
                        to: 'version.txt',
                        transform: (content) => JSON.parse(content.toString()).version,
                    },
                ],
            }),
        ],

        resolve: {
            extensions: ['.js'],
        },

        performance: {
            hints: false,
        },
    };
};
