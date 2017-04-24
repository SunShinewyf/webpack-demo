/**
 * author:SunShinewyf
 * date:2017-02-22
 */
module.exports = {
    entry: {
        'example1': './example1',
        'example2': './example2'
    },
    output: {
        filename: '[name]-[chunkhash:8].js'
    }
};