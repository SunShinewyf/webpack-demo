### image-webpack-plugin
### 功能
输出入口文件中关联到的图片到指定路径中
### use

-放进`node_modules`文件夹
-在`webpack.config.js`中加入该项配置

```js
const imageWebpackPlugin = require('image-webpack-plugin');
//....
 new imageWebpackPlugin({
           publicPath:'images/',
           root:__dirname
 })
```

### options

 - `publicPath`:输出的最终路径

 - `root`: 项目根路径