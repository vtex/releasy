require('shelljs/global');
var path = require('path');

module.exports = (function(){
  var folder = path.dirname(module.filename) + '/providers';
  var files = ls(folder);
  var modules = [];
  for (var i in files) {
    modules.push(require('./providers/' + files[i]));
  }

  return modules;
})();
