var _ = require('lodash')
var async = require('async')
var path = require('path')
var Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'));

function ImageWebpackPlugin(options){
    var initialOptions = {
        publicPath:'',
        root:''
    };
    //进行参数合并
    this.options = mergeOptions(initialOptions,options); 
}


function mergeOptions(a, b) {
    if(!b) return a;
    Object.keys(b).forEach(function(key) {
        a[key] = b[key];
    });
    return a;
}

ImageWebpackPlugin.prototype.apply = function(compiler){
  var self = this;
  var outputPath = self.options.publicPath,
      root = self.options.root;
  var fullPath = root+'/'+outputPath;
  
  compiler.plugin("compilation", function(compilation) {
    var files = [],imageFiles=[],uniqImageFile=[];
    compilation.plugin("optimize-chunks", function(chunks,modules,callback) {

        async.forEach(chunks, function(chunk, callback) {
            async.forEach(chunk.modules.slice(), function(module, callback) {
                var fileName = module.rawRequest.split('/');
                //获取最后面的图片信息 eg:'xx/xx/1.jpg'  返回1.jpg
                var name = fileName[fileName.length-1]; 
                var context = module.context;
                var dir = context + '/' + name;
                files.push({
                    name:name,
                    dir: dir,
                    content:module._source
                })
            },function(err){
                if(err) return callback(err);
				callback();
            })
        },function(err){
            if(err) return callback(err);
        }.bind(this));
          imageFiles = _.filter(files,function(s){
              //将关联的chunks进行过滤，筛选出图片文件目录
            return /\.(png|jpg|gif)$/.test(s.name)
          })
    }.bind(this));

    compilation.plugin("additional-assets", function(callback) {
        //将数组中重复的文件进行过滤，有可能同一个文件被多次引用
        uniqImageFile = _.uniq(imageFiles);
        if(uniqImageFile.length){
            uniqImageFile.forEach(function(file){
                var source = file.content;
                //判断图片是被什么loader处理过 
                //被file-loader处理过 则source._value的形式如下：
                //module.exports = __webpack_public_path__ + "images/2.d8a4ec77fb648e8abb956eb7df11174e.png";
                if(source._value.indexOf("__webpack_public_path__")!=-1) {
                    return;
                }else{
                    //被url-loader处理过 则source._value则是base64的字符码
                    var name = file.name;
                    // var fileContent =  source;
                    // console.log(fileContent)
                   
                    var  content = source._value.split('"')[1];
                    // var contentBuffer = new Buffer(source._value.split('"')[1],'base64')
                    // console.log(contentBuffer.toString())
                    var finalSource = {
                        _value:content,
                        _name:source._name
                    };
                    // console.log(Object.keys(finalSource))
                    // Compile.js会报错	var content = source.source();
                    compilation.assets['jjjj'] = {
                        source:function(){
                            return content;
                        },
                        size:function(){
                            return content.length
                        }
                    }
                }  
            //     fs.readFile(file.dir, { encoding: 'binary'},function(err,data){
            //         if(err) throw err;
            //         // console.log(data)
            //         // var source = data.toString();
            //         fs.writeFile(fullPath+file.name,{encoding:'binary'},function(err,data){
            //             // if(err) throw err;
            //         // })
            //     //    fs.writeFile(__dirname + '/test.txt', w_data, {flag: 'a'}, function (err)
            //     })
            // })              
            },this)
            callback()
        }else{
            return;
        }
    }.bind(this));
  });

}

module.exports = ImageWebpackPlugin;