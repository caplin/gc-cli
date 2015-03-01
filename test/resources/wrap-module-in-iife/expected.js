(function() {
  var globalLibrary = require('globallibrary');
  my.libraryinclude('otherlibrary');
  my.libraryinclude('globallibrary');
  my.libraryinclude('libraryplugin');

  function SimpleClass() {
  }

  SimpleClass.prototype._initMethod = function() {
  }

  SimpleClass.prototype.callToSuper = function() {
  }

  module.exports = SimpleClass;
})();
