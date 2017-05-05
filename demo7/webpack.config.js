const webpack = require('webpack');
const path = require('path');

module.exports = {
    entry: {
        app:'./app',
    },

    output:{
        path:path.resolve(__dirname,"build"),
        filename:'bundle.js'
    }
}