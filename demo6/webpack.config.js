const webpack = require('webpack');
const extractTextPlugin = require('extract-text-webpack-plugin');
const WebpackMd5Hash = require('webpack-md5-hash')

module.exports = {
    entry: {
        'a': './a',
        'b': './b'
    },

    output:{
        filename:'[name]-[chunkhash].js'
    },
    module: {
        loaders: [{
            test: /\.css$/,
            loader: extractTextPlugin.extract({ fallback: 'style-loader', use: 'css-loader' })
        }],
    },
    plugins: [
        new extractTextPlugin('[name].[contenthash:4].css'),
        new WebpackMd5Hash()
    ],
}