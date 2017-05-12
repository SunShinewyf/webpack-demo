var map = require('lodash.map')
var RawSource = require('webpack-sources/lib/RawSource')
var createThrottle = require('async-throttle');
var imagemin = require('imagemin')
var makeRe = require('minimatch')
var os = require('os')


function ImageWebpackPlugin(options){
    var initialOptions = {
        test:/.*/,  //默认匹配所有图片,即没有后缀限制
        filename:'',
        maxConcurrency: os.cpus().length
    };
    this.options = mergeOptions(initialOptions,options);  //进行参数合并
}


function mergeOptions(a, b) {
    if(!b) return a;
    Object.keys(b).forEach(function(key) {
        a[key] = b[key];
    });
    return a;
}

function testFile (filename, regexes) {
    for (let regex of regexes) {
        if (regex.test(filename)) {
            return true
        }
    }
    return false
}

function optimizeImage (asset) {
    const assetSource = asset.source()
    const assetOrigSize = asset.size()

    const assetContents = (Buffer.isBuffer(assetSource) ? assetSource : new Buffer(assetSource, 'utf8'))

    const optimizedAssetContents = imagemin.buffer(assetContents)

    if (optimizedAssetContents.length < assetOrigSize) {
        return new RawSource(optimizedAssetContents)
    } else {
        return asset
    }
}

ImageWebpackPlugin.prototype.apply = function(compiler){

    var self = this;

    compiler.plugin('emit',function (compilation,callback) {
        const throttle = createThrottle(self.options.maxConcurrency)
        try{
            Promise.all(map(compilation.assets),function (assets,filename) {
                var name = self.options.filename ? self.options.filename : filename;
                if(testFile(filename,self.options.test)){
                    compilation.fileDependencies.push(filename)
                    compilation.assets[name] = optimizeImage(assets)
                }
            })
            callback()
        }catch (err){
            callback(err)
        }
    })
}

module.exports = ImageWebpackPlugin;