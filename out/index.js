"use strict";
Object.defineProperties(exports, {
  processFile: {get: function() {
      return processFile;
    }},
  __esModule: {value: true}
});
var glob = require('glob');
var compileFile = require('global-compiler').compileFile;
function processFile(options) {
  var sourceFiles = glob.sync('src/**/*.js');
  var filesMetadata = sourceFiles.map(generateFileMetadata);
  var processedFiles = filesMetadata.map((function(fileMetadata) {
    return compileFile(['--flatten', fileMetadata.namespace, fileMetadata.fileName]);
  }));
  console.log(processedFiles[0]);
}
function generateFileMetadata(fileName) {
  var namespace = fileName.replace(/^src\//, '').replace(/\.js$/, '').replace(/\//g, '.');
  return {
    namespace: namespace,
    fileName: fileName
  };
}
