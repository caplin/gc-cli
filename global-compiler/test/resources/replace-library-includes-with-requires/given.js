var globalLibrary = require('globallibrary');
var someLibrary = require('somelibrary');
my.libraryinclude('otherlibrary');
my.libraryinclude('sOmelibrary');
my.libraryinclude('globallibrary');
my.libraryinclude('libraryplugin');

function SimpleClass() {
}

SimpleClass.prototype._initMethod = function() {
}

SimpleClass.prototype.callToSuper = function() {
}

module.exports = SimpleClass;
