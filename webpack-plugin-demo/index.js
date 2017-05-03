import map from 'lodash.map'
import RawSource from 'webpack-sources/lib/RawSource'
import imagemin from 'imagemin'
import imageminPngquant from 'imagemin-pngquant'
import imageminOptipng from 'imagemin-optipng'
import imageminGifsicle from 'imagemin-gifsicle'
import imageminJpegtran from 'imagemin-jpegtran'
import imageminSvgo from 'imagemin-svgo'
import { cpus } from 'os'
import createThrottle from 'async-throttle'
import { makeRe } from 'minimatch'


function ImageWebpackPlugin(options){
    var initialOptions = {
        disable:true, //是否启动压缩功能
        test:/.*/,  //默认匹配所有图片,即没有后缀限制
        maxConcurrency: cpus().length,
    };
    this.options = mergeOptions(initialOptions,this.options);  //进行参数合并
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

async function optimizeImage (asset, imageminOptions) {
    const assetSource = asset.source()
    const assetOrigSize = asset.size()

    const assetContents = (Buffer.isBuffer(assetSource) ? assetSource : new Buffer(assetSource, 'utf8'))

    const optimizedAssetContents = await imagemin.buffer(assetContents, imageminOptions)

    if (optimizedAssetContents.length < assetOrigSize) {
        return new RawSource(optimizedAssetContents)
    } else {
        return asset
    }
}

ImageWebpackPlugin.prototype.apply = function(compiler){
    if(this.options.disable == false) return null;
    compiler.plugin('emit', async (compilation, callback) => {
        const throttle = createThrottle(this.options.maxConcurrency)

        try {
            await Promise.all(map(compilation.assets, (asset, filename) => throttle(async () => {
                if (testFile(filename, this.options.test)) {
                    compilation.assets[filename] = await optimizeImage(asset, this.options.imageminOptions)
                }
            })))

            callback()
        } catch (err) {
            callback(err)
        }
    })
}

module.exports = ImageWebpackPlugin;

