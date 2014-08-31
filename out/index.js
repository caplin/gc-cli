"use strict";
Object.defineProperties(exports, {
  processFile: {get: function() {
      return processFile;
    }},
  __esModule: {value: true}
});
var fs = require('fs');
var recast = require('recast');
var through2 = require('through2');
var globStream = require('glob-stream');
function processFile(options) {
  var stream = globStream.create('src/**/*.js').pipe(createJsAst());
}
function createJsAst() {
  return through2.obj(function(fileMetadata, encoding, callback) {
    console.log(fileMetadata);
    fs.readFile(fileMetadata.path, (function(error, data) {
      if (error) {
        return callback(null, error);
      }
      var fileAst = recast.parse(data);
      fileMetadata.ast = fileAst;
      callback(fileMetadata);
    }));
  });
}
function generateFileMetadata(fileName) {
  var namespace = fileName.replace(/^src\//, '').replace(/\.js$/, '').replace(/\//g, '.');
  return {
    namespace: namespace,
    fileName: fileName
  };
}
