var webpack = require('webpack');
var webpackDev = require('./webpack.config');

var config = Object.assign(webpackDev,{
    devtool:'cheap-module-eval-source-map'
});

module.exports = config;