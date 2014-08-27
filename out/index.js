"use strict";
Object.defineProperties(exports, {
  processFile: {get: function() {
      return processFile;
    }},
  __esModule: {value: true}
});
var glob = require('glob');
var minimist = require('minimist');
var compileFile = require('global-compiler').compileFile;
function processFile(options) {
  var files = glob.sync('src/**/*.js');
  console.log(files);
}
