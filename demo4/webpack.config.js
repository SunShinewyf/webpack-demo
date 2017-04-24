const extractTextPlugin = require('extract-text-webpack-plugin');
const webpack = require('webpack');
const WebpackMd5Hash = require('webpack-md5-hash')

module.exports = {
    entry: {
        'pageA': './pageA',
        'pageB': './pageB'
    },

    output:{
        filename:'[id]-[name]-[chunkhash].js'
    },
    module: {
        loaders: [{
            test: /\.css$/,
            loader: extractTextPlugin.extract({ fallback: 'style-loader', use: 'css-loader' })
        }],
    },
    plugins: [
        // 这里的 contenthash 是 ExtractTextPlugin 根据抽取输出的文件内容计算得到
        new extractTextPlugin('[name].[contenthash:4].css'),
        // new webpack.optimize.CommonsChunkPlugin({
        //     name: "commons",
        //     minChunks: 2,
        //     chunks: ["pageA", "pageB"],
        // }),
        new WebpackMd5Hash()
    ],
}