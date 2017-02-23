var a = require('./a')
a.sayName();

require.ensure(['./b'], function (require) {
    var b = require('./b');
    b.sayName();
});

require(['./c'], function (c) {
    c.sayName()
})