var webpack = require('webpack');

module.exports = {
    entry: {
        main1: './main1',
        main2: './main2'
    },
    output: {
        filename: 'bundle.[name].js'
    },
    plugins: [
        new webpack.optimize.CommonsChunkPlugin({
            name: 'commons',
            filename: 'commons.js',
            chunks: ["main1", "main2"]
        })
    ]
};