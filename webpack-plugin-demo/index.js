/**
 * author:SunShinewyf
 * date:2017-04-27
 **/
function HelloWorldPlugin(options) {

}

HelloWorldPlugin.prototype.apply = function(compiler){
    compiler.plugin('done',function(){
        console.log('hello world');
    });
};

module.exports = HelloWorldPlugin;