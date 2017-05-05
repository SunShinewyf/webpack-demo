const webpack = require('webpack');
const path = require('path');

module.exports = {
    entry: [
        'webpack-dev-server/client?http://localhost:8080/',
        './app'
    ],
    output:{
        filename:'bundle.js'
    }
}