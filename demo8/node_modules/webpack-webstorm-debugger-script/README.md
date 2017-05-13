# webpack-webstorm-debugger-script
Script to debug webpack plugins and loaders with WebStorm.

Kind regards to http://blog.assaf.co/debugging-a-webpack-plugin-loader/

#### Usage (version 1):
- Place webstorm-debugger.js in a folder with your webpack.config
- Right click on script and select Debug option

#### Usage (version 2):
- npm install webpack-webstorm-debugger-script
- add run/debug configuration in WebStorm:  
  type Node.js and Node parameters: `./node_modules/webpack-webstorm-debugger-script`
- Run debug button 

#### Notes:
- If not works - please install webpack globally `npm install webpack -g`
- If WebStorm not stops on breakpoints - please setup them directly with `debugger;` command