const webpack = require('webpack');
const extractTextPlugin = require('extract-text-webpack-plugin');
const imageWebpackPlugin = require('image-webpack-plugin');
const CopyWebpackplugin = require('copy-webpack-plugin')
// const ImageminPlugin = require('imagemin-webpack-plugin');



module.exports = {
    entry: {
        'a': './a',
    },

    output:{
        filename:'[name]-[chunkhash].js'
    },
    module: {
        loaders: [
            {
                test: /\.css$/,
                loader: extractTextPlugin.extract({ fallback: 'style-loader', use: 'css-loader' })
            },
            {
                test:  /\.(png|jpg)$/,
                loader:'url-loader?limit=20000000&name=images/[name].[hash].[ext]'
            }
        ],
    },
    plugins: [
        new extractTextPlugin('[name].[contenthash:4].css'),
        new CopyWebpackplugin([{
            from: 'im'
        }]),
        // new Image
        new imageWebpackPlugin({
            test:/\.(png|jpg)$/,
            filename:'[hash].[ext]'
        })
    ],
}