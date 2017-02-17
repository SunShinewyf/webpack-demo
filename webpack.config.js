/**
 * author:SunShinewyf
 * date:2017-02-17
 */
var path = require('path')

module.exports = {
    entry: path.resolve(__dirname, 'app/index.js'),
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: 'bundle.js'
    }
};