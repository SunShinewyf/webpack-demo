对webpack做了一些尝试，在该过程中沉淀的一些知识收录在issue里了，欢迎watch和star

## webpack的源码解读

在`shell`中执行`webpack`相关命令时，webpack在源码文件里面到底是一种怎样的执行流程呢？

首先先附上淘宝FED团队的一张图：


![template](https://raw.githubusercontent.com/SunShinewyf/webpack-demo/master/assets/9.png)

看图还不太了解，可以移步[这里](http://taobaofed.org/blog/2016/09/09/webpack-flow/)

现在结合源码来看一下：

首先会执行`bin/webpack`,先来看一下`bin/webpack.js`的代码
```js
//引入path模块
 var path = require("path");

 //解析出webpack的绝对路径
 try {
     var localWebpack = require.resolve(path.join(process.cwd(), "node_modules", "webpack", "bin", "webpack.js"));
     if(__filename !== localWebpack) {
         return require(localWebpack);
     }
 } catch(e) {}

 //调用processOptions()
 processOptions(options);
```
然后看一下`processOptions()`这个函数，去除了一些对参数的处理：
```js
function processOptions(options) {
    ///..调用该文件定义的ifArg方法将参数进行解析,然后作出不同处理
    .....


    //引入核心的webpack
    var webpack = require("../lib/webpack.js");

    Error.stackTraceLimit = 30;
    var lastHash = null;
    var compiler;
    try {
        compiler = webpack(options);
    } catch(e) {
        var WebpackOptionsValidationError = require("../lib/WebpackOptionsValidationError");
        if(e instanceof WebpackOptionsValidationError) {
            if(argv.color)
                console.error("\u001b[1m\u001b[31m" + e.message + "\u001b[39m\u001b[22m");
            else
                console.error(e.message);
            process.exit(1); // eslint-disable-line no-process-exit
        }
        throw e;
    }


    function compilerCallback(err, stats) {
        ...
    }
    if(firstOptions.watch || options.watch) {
        var watchOptions = firstOptions.watchOptions || firstOptions.watch || options.watch || {};
        if(watchOptions.stdin) {
            process.stdin.on("end", function() {
                process.exit(0); // eslint-disable-line
            });
            process.stdin.resume();
        }
        compiler.watch(watchOptions, compilerCallback);
        console.log("\nWebpack is watching the files…\n");
    } else
        compiler.run(compilerCallback);
}
```
可以看到，这个函数主要是引入了核心的`webpack`,并且对解析出来的参数做出了不同处理，然后对如果是`webpack -watch`时进行单独处理，否则就调用`compilerCallback`,
然后我们可以看一下核心的`lib/webpack`文件：
```js
/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
"use strict";

const Compiler = require("./Compiler");
const MultiCompiler = require("./MultiCompiler");
const NodeEnvironmentPlugin = require("./node/NodeEnvironmentPlugin");
const WebpackOptionsApply = require("./WebpackOptionsApply");
const WebpackOptionsDefaulter = require("./WebpackOptionsDefaulter");
const validateSchema = require("./validateSchema");
const WebpackOptionsValidationError = require("./WebpackOptionsValidationError");
const webpackOptionsSchema = require("../schemas/webpackOptionsSchema.json");

function webpack(options, callback) {
}
exports = module.exports = webpack;

webpack.WebpackOptionsDefaulter = WebpackOptionsDefaulter;
webpack.WebpackOptionsApply = WebpackOptionsApply;
webpack.Compiler = Compiler;
webpack.MultiCompiler = MultiCompiler;
webpack.NodeEnvironmentPlugin = NodeEnvironmentPlugin;
webpack.validate = validateSchema.bind(this, webpackOptionsSchema);
webpack.validateSchema = validateSchema;
webpack.WebpackOptionsValidationError = WebpackOptionsValidationError;

function exportPlugins(exports, path, plugins) {}

exportPlugins(exports, ".", []);
exportPlugins(exports.optimize = {}, "./optimize", []);
exportPlugins(exports.dependencies = {}, "./dependencies", []);

```

从源码中可以看出，该文件主要是定义了`webpack`这个模块的一些属性，并且实现了`webpack()`以及`exportPlugins()`,最后列出了一些插件的使用
然后我们可以看一下webpack()实现了什么：
```js
function webpack(options, callback) {
    //对参数的一些校验
	const webpackOptionsValidationErrors = validateSchema(webpackOptionsSchema, options);
	if(webpackOptionsValidationErrors.length){
		throw new WebpackOptionsValidationError(webpackOptionsValidationErrors);
	}
	let compiler;
	//当是数组时，实例化MultiCompiler
	if(Array.isArray(options)) {
		compiler = new MultiCompiler(options.map(options => webpack(options)));
	} else if(typeof options === "object") {
	   //如果是对象时
		new WebpackOptionsDefaulter().process(options);
       //实例化Compiler

		compiler = new Compiler();
		compiler.context = options.context;
		compiler.options = options;
		new NodeEnvironmentPlugin().apply(compiler);
		if(options.plugins && Array.isArray(options.plugins)) {
			compiler.apply.apply(compiler, options.plugins);
		}
		compiler.applyPlugins("environment");
		compiler.applyPlugins("after-environment");
		compiler.options = new WebpackOptionsApply().process(options, compiler);
	} else {
		throw new Error("Invalid argument: options");
	}
	if(callback) {
		if(typeof callback !== "function") throw new Error("Invalid argument: callback");
		if(options.watch === true || (Array.isArray(options) && options.some(o => o.watch))) {
			const watchOptions = Array.isArray(options) ? options.map(o => o.watchOptions || {}) : (options.watchOptions || {});
			return compiler.watch(watchOptions, callback);
		}
	//执行compile
		compiler.run(callback);
	}
	return compiler;
}

```
可以看到，`webpack`除了根据传进来的`options`的不同情况做了不同处理，然后主要是调用了`Compile.run()`方法；
然后转到`lib/Compile.js`这里.通过收合里面的一些代码，可以看到该文件的整体框架如下图所示：

![template](https://raw.githubusercontent.com/SunShinewyf/webpack-demo/master/assets/16.png)

通过图示可以知道，这个文件主要是定义了`Compile`这个类，并且声明和实现了一些属性和方法。我们来着重看看`Compile.run()`这个方法
由于webpack继承自tapable这个类，所以可以看到在run方法中都是在调用tapable的一些方法：
```js
Compiler.prototype.run = function(callback) {
	var self = this;
	var startTime = new Date().getTime();

	self.applyPluginsAsync("before-run", self, function(err) {
		if(err) return callback(err);

		self.applyPluginsAsync("run", self, function(err) {
			if(err) return callback(err);

			self.readRecords(function(err) {
				if(err) return callback(err);

				self.compile(function onCompiled(err, compilation) {
                        ....
					});
				});
			});
		});
	});
};
```
可以看到这个`run`方法里面又调用了`Compile`里面的`compile`方法，然后继续追踪`compile`方法。
```js
Compiler.prototype.compile = function(callback) {
	var self = this;
	var params = self.newCompilationParams();
	self.applyPluginsAsync("before-compile", params, function(err) {
		if(err) return callback(err);

		self.applyPlugins("compile", params);

		var compilation = self.newCompilation(params);
        //触发make事件
		self.applyPluginsParallel("make", compilation, function(err) {
			if(err) return callback(err);

			compilation.finish();
            //调用compilation.seal()
			compilation.seal(function(err) {
				if(err) return callback(err);

				self.applyPluginsAsync("after-compile", compilation, function(err) {
					if(err) return callback(err);

					return callback(null, compilation);
				});
			});
		});
	});
};
```
可以看到这个方法主要是触发了make事件，并且调用了`Compilation`里面的`seal()`方法。我们继续查看`seal()`干了啥.同样的，`Compilation`主要是实现`Compilation`这个模块的属性
和方法。
我们先看看seal():
```js

	seal(callback) {
		const self = this;
		self.applyPlugins0("seal");
		self.nextFreeModuleIndex = 0;
		self.nextFreeModuleIndex2 = 0;
		self.preparedChunks.forEach(preparedChunk => {
			const module = preparedChunk.module;
			const chunk = self.addChunk(preparedChunk.name, module);
			const entrypoint = self.entrypoints[chunk.name] = new Entrypoint(chunk.name);
			entrypoint.unshiftChunk(chunk);

			chunk.addModule(module);
			module.addChunk(chunk);
			chunk.entryModule = module;
			self.assignIndex(module);
			self.assignDepth(module);
			self.processDependenciesBlockForChunk(module, chunk);
		});
		self.sortModules(self.modules);
		self.applyPlugins0("optimize");

		while(self.applyPluginsBailResult1("optimize-modules-basic", self.modules) ||
			self.applyPluginsBailResult1("optimize-modules", self.modules) ||
			self.applyPluginsBailResult1("optimize-modules-advanced", self.modules)); // eslint-disable-line no-extra-semi
		self.applyPlugins1("after-optimize-modules", self.modules);

		while(self.applyPluginsBailResult1("optimize-chunks-basic", self.chunks) ||
			self.applyPluginsBailResult1("optimize-chunks", self.chunks) ||
			self.applyPluginsBailResult1("optimize-chunks-advanced", self.chunks)); // eslint-disable-line no-extra-semi
		self.applyPlugins1("after-optimize-chunks", self.chunks);

		self.applyPluginsAsyncSeries("optimize-tree", self.chunks, self.modules, function sealPart2(err) {
			if(err) {
				return callback(err);
			}

			self.applyPlugins2("after-optimize-tree", self.chunks, self.modules);

			const shouldRecord = self.applyPluginsBailResult("should-record") !== false;

			self.applyPlugins2("revive-modules", self.modules, self.records);
			self.applyPlugins1("optimize-module-order", self.modules);
			self.applyPlugins1("advanced-optimize-module-order", self.modules);
			self.applyPlugins1("before-module-ids", self.modules);
			self.applyPlugins1("module-ids", self.modules);
			self.applyModuleIds();
			self.applyPlugins1("optimize-module-ids", self.modules);
			self.applyPlugins1("after-optimize-module-ids", self.modules);

			self.sortItemsWithModuleIds();

			self.applyPlugins2("revive-chunks", self.chunks, self.records);
			self.applyPlugins1("optimize-chunk-order", self.chunks);
			self.applyPlugins1("before-chunk-ids", self.chunks);
			self.applyChunkIds();
			self.applyPlugins1("optimize-chunk-ids", self.chunks);
			self.applyPlugins1("after-optimize-chunk-ids", self.chunks);

			self.sortItemsWithChunkIds();

			if(shouldRecord)
				self.applyPlugins2("record-modules", self.modules, self.records);
			if(shouldRecord)
				self.applyPlugins2("record-chunks", self.chunks, self.records);

			self.applyPlugins0("before-hash");
			self.createHash();
			self.applyPlugins0("after-hash");

			if(shouldRecord)
				self.applyPlugins1("record-hash", self.records);

			self.applyPlugins0("before-module-assets");
			self.createModuleAssets();
			if(self.applyPluginsBailResult("should-generate-chunk-assets") !== false) {
				self.applyPlugins0("before-chunk-assets");
				self.createChunkAssets();
			}
			self.applyPlugins1("additional-chunk-assets", self.chunks);
			self.summarizeDependencies();
			if(shouldRecord)
				self.applyPlugins2("record", self, self.records);

			self.applyPluginsAsync("additional-assets", err => {
				if(err) {
					return callback(err);
				}
				self.applyPluginsAsync("optimize-chunk-assets", self.chunks, err => {
					if(err) {
						return callback(err);
					}
					self.applyPlugins1("after-optimize-chunk-assets", self.chunks);
					self.applyPluginsAsync("optimize-assets", self.assets, err => {
						if(err) {
							return callback(err);
						}
						self.applyPlugins1("after-optimize-assets", self.assets);
						if(self.applyPluginsBailResult("need-additional-seal")) {
							self.unseal();
							return self.seal(callback);
						}
						return self.applyPluginsAsync("after-seal", callback);
					});
				});
			});
		});
	}
```
这个函数大量使用了`Tapable`中的`applyPlugins`，并且可以看到调用了`createHash()`。这个时候就是webpack产生hash值的时候，然后再调用了`createChunkAssets()`函数，
从而生成一些文件和模块。这两个函数实现了什么时候`updateHash`以及对缓存文件是否存在进行检测，并生成对应的`chunk`文件

一路分析下来，感觉`webpack`的源码其实就是引入了很多依赖，然后有点绕，看了一边之后还是稍微了解了一下它大概的流程，只是一些更细节的地方还有待斟酌












