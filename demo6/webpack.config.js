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
        loaders: [
            {
            test: /\.css$/,
            loader: extractTextPlugin.extract({ fallback: 'style-loader', use: 'css-loader' })
            },
            {
                // 图片加载器，雷同file-loader，更适合图片，可以将较小的图片转成base64，减少http请求
                // 如下配置，将小于8192byte的图片转成base64码
                test: /\.(png|jpg|gif)$/,
                loader: 'url-loader?limit=8192&name=../images/[name].[ext]?[hash]',
            }
        ],
    },
    plugins: [
        new extractTextPlugin('[name].[contenthash:4].css'),
        new WebpackMd5Hash()
    ],
}