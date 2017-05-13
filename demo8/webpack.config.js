const webpack = require('webpack');
const extractTextPlugin = require('extract-text-webpack-plugin');
const imageWebpackPlugin = require('image-webpack-plugin');
const path = require('path');
// var HtmlWebpackPlugin = require('html-webpack-plugin');
// const CopyWebpackplugin = require('copy-webpack-plugin');
// const ImageminPlugin = require('imagemin-webpack-plugin').default;



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
                loader:'url-loader?limit=200000000&name=images/[name].[hash].[ext]'
            }
        ],
    },
    plugins: [
        new extractTextPlugin('[name].[contenthash:4].css'),
        // new Image
        // new ImageminPlugin({
        //     test:/\.(png|jpg)$/
        // })
        // new HtmlWebpackPlugin(),
        new imageWebpackPlugin({
           publicPath:'images/',
           root:__dirname
        })
    ],
}