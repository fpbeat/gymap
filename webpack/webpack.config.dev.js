const Path = require('path');
const Webpack = require('webpack');
const merge = require('webpack-merge');
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
const LessPluginInlineSvg = require('less-plugin-inline-svg');
const common = require('./webpack.common.js');

module.exports = merge(common, {
    mode: 'development',
    devtool: 'cheap-eval-source-map',
    output: {
        filename: 'js/[name].bundle.js',
    },
    devServer: {
        quiet: true,
        hot: true,
        inline: true
    },
    plugins: [
        new FriendlyErrorsWebpackPlugin({
            clearConsole: true
        }),
        new Webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('development'),
            NAMESPACE: JSON.stringify(require("../package.json").name)
        })
    ],
    module: {
        rules: [
            {
                test: /\.(js)$/,
                include: Path.resolve(__dirname, '../src'),
                enforce: 'pre',
                loader: 'eslint-loader',
                options: {
                    emitWarning: true,
                }
            },
            {
                test: /\.(js)$/,
                include: Path.resolve(__dirname, '../src'),
                loader: 'babel-loader'
            },
            {
                test: /\.(css|less)$/i,
                use: ['style-loader', 'css-loader', 'postcss-loader', {
                    loader: 'less-loader',
                    options: {
                        paths: [
                            Path.resolve(__dirname, '../images'),
                            Path.resolve(__dirname, 'node_modules'),
                        ],
                        plugins: [
                            new LessPluginInlineSvg({
                                base64: true,
                                basePath: Path.resolve(__dirname, '../images')
                            })
                        ]
                    }
                }]
            }
        ]
    }
});
