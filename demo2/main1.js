var a = require('./a')
a.sayName();

require.ensure(['./b'], function () {
    var b = require('./b');
    b.sayName();
});

require(['./c'], function (c) {
    c.sayName()
})