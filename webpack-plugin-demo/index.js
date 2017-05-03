/**
 * author:SunShinewyf
 * date:2017-04-27
 **/
var fs = require('fs');
var async = require("async");
var ConcatSource = require("webpack-sources").ConcatSource;
var Chunk = require("webpack/lib/Chunk");

function ImageWebpackPlugin(options) {
     if(options.length > 1){
         throw new Error("Breaking change: extract now only takes a single argument");
     }
     this.options = {};
     mergeOptions(this.options,options);
     var loader = options.use || '';
     var fallback = options.fallback || '';
}

function ExtractTextPluginCompilation() {
    this.modulesByIdentifier = {};
}

ExtractTextPluginCompilation.prototype.addResultToChunk = function(identifier, result, originalModule, extractedChunk) {
    if(!Array.isArray(result)) {
        result = [[identifier, result]];
    }
    var counterMap = {};
    var prevModules = [];
    result.forEach(function(item) {
        var c = counterMap[item[0]];
        var module = this.addModule.call(this, item[0] + (c || ""), originalModule, item[1], item[2], item[3], prevModules.slice());
        extractedChunk.addModule(module);
        module.addChunk(extractedChunk);
        counterMap[item[0]] = (c || 0) + 1;
        prevModules.push(module);
    }, this);
};

ImageWebpackPlugin.prototype.mergeNonInitialChunks = function(chunk, intoChunk, checkedChunks) {
    if(!intoChunk) {
        checkedChunks = [];
        chunk.chunks.forEach(function(c) {
            if(c.isInitial()) return;
            this.mergeNonInitialChunks(c, chunk, checkedChunks);
        }, this);
    } else if(checkedChunks.indexOf(chunk) < 0) {
        checkedChunks.push(chunk);
        chunk.modules.slice().forEach(function(module) {
            intoChunk.addModule(module);
            module.addChunk(intoChunk);
        });
        chunk.chunks.forEach(function(c) {
            if(c.isInitial()) return;
            this.mergeNonInitialChunks(c, intoChunk, checkedChunks);
        }, this);
    }
};

//the usage of this function is like $.extend in jquery
function mergeOptions(a, b) {
    if(!b) return a;
    Object.keys(b).forEach(function(key) {
        a[key] = b[key];
    });
    return a;
}

ImageWebpackPlugin.prototype.apply = function(compiler){
    var self = this;
    var options = self.options;
    var filename = self.filename;
    var id = self.id;
    var imageChunks;
    compiler.plugin('this-compilation',function(compilation){
        var extractCompilation = new ExtractTextPluginCompilation();
        compilation.plugin("normal-module-loader", function(loaderContext, module) {
            loaderContext[NS] = function(content, opt) {
                if(options.disable)
                    return false;
                if(!Array.isArray(content) && content != null)
                    throw new Error("Exported value was not extracted as an array: " + JSON.stringify(content));
                module[NS] = {
                    content: content,
                    options: opt || {}
                };
                return options.allChunks || module[NS + "/extract"]; // eslint-disable-line no-path-concat
            };
        });
        compilation.plugin('optimize-tree', function(chunks, modules) {
            imageChunks = chunks.map(function() {
                return new Chunk();
            });
            chunks.forEach(function(chunk, i) {
                var imageChunk = imageChunks[i];
                imageChunk.index = i;
                imageChunk.originalChunk = chunk;
                imageChunk.name = chunk.name;
                imageChunk.entrypoints = chunk.entrypoints;
                chunk.chunks.forEach(function(c) {
                    imageChunk.addChunk(imageChunks[chunks.indexOf(c)]);
                });
                chunk.parents.forEach(function(c) {
                    imageChunk.addParent(imageChunks[chunks.indexOf(c)]);
                });
            });
        });
        async.forEach(chunks, function(chunk, callback) {
            var imageChunk = imageChunks[chunks.indexOf(chunk)];
            var shouldExtract = !!(options.allChunks || chunk.isInitial());
            async.forEach(chunk.modules.slice(), function(module, callback) {
                var meta = module[NS];
                if(meta && (!meta.options.id || meta.options.id === id)) {
                    var wasExtracted = Array.isArray(meta.content);
                    if(shouldExtract !== wasExtracted) {
                        module[NS + "/extract"] = shouldExtract; // eslint-disable-line no-path-concat
                        compilation.rebuildModule(module, function(err) {
                            if(err) {
                                compilation.errors.push(err);
                                return callback();
                            }
                            meta = module[NS];
                            if(!Array.isArray(meta.content)) {
                                err = new Error(module.identifier() + " doesn't export content");
                                compilation.errors.push(err);
                                return callback();
                            }
                            if(meta.content)
                                extractCompilation.addResultToChunk(module.identifier(), meta.content, module, imageChunk);
                            callback();
                        });
                    } else {
                        if(meta.content)
                            extractCompilation.addResultToChunk(module.identifier(), meta.content, module, imageChunk);
                        callback();
                    }
                } else callback();
            }, function(err) {
                if(err) return callback(err);
                callback();
            });
        }, function(err) {
            if(err) return callback(err);
            imageChunks.forEach(function(extractedChunk) {
                if(extractedChunk.isInitial())
                    this.mergeNonInitialChunks(extractedChunk);
            }, this);
            imageChunks.forEach(function(extractedChunk) {
                if(!extractedChunk.isInitial()) {
                    extractedChunk.modules.slice().forEach(function(module) {
                        extractedChunk.removeModule(module);
                    });
                }
            });
            compilation.applyPlugins("optimize-extracted-chunks", imageChunks);
            callback();
        }.bind(this));
    }.bind(this));


};

module.exports = ImageWebpackPlugin;