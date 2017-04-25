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

    if(argv.progress) {
        var ProgressPlugin = require("../lib/ProgressPlugin");
        compiler.apply(new ProgressPlugin({
            profile: argv.profile
        }));
    }

    function compilerCallback(err, stats) {
        if(!options.watch || err) {
            // Do not keep cache anymore
            compiler.purgeInputFileSystem();
        }
        if(err) {
            lastHash = null;
            console.error(err.stack || err);
            if(err.details) console.error(err.details);
            process.exit(1); // eslint-disable-line
        }
        if(outputOptions.json) {
            process.stdout.write(JSON.stringify(stats.toJson(outputOptions), null, 2) + "\n");
        } else if(stats.hash !== lastHash) {
            lastHash = stats.hash;
            process.stdout.write(stats.toString(outputOptions) + "\n");
        }
        if(!options.watch && stats.hasErrors()) {
            process.on("exit", function() {
                process.exit(2); // eslint-disable-line
            });
        }
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