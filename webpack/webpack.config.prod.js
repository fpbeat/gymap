const Path = require('path');
const Webpack = require('webpack');
const merge = require('webpack-merge');
const TerserJSPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');

const LessPluginInlineSvg = require('less-plugin-inline-svg');
const common = require('./webpack.common.js');

module.exports = merge(common, {
    mode: 'production',
    optimization: {
        minimizer: [
            new TerserJSPlugin({
                cache: true,
                parallel: true
            }),
            new OptimizeCSSAssetsPlugin({})
        ]
    },
    devtool: false,
    stats: 'errors-only',
    bail: true,
    output: {
        filename: 'js/[name].bundle.js',
    },

    plugins: [
        new Webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('production'),
            NAMESPACE: JSON.stringify(require("../package.json").name)
        }),
        new Webpack.optimize.ModuleConcatenationPlugin(),
        new MiniCssExtractPlugin({
            filename: 'bundle.css'
        })
    ],
    module: {
        rules: [
            {
                test: /\.(js)$/,
                exclude: /node_modules/,
                use: 'babel-loader'
            },
            {
                test: /\.(css|less)$/i,
                use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader', {
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
