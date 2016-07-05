require('shelljs/global');
var path = require('path');

module.exports = (function(){
  var folder = path.dirname(module.filename) + '/providers';
  var files = ls(folder);
  var modules = [];
  files.forEach(function (file) {
    modules.push(require('./providers/' + file));
  })

  return modules;
})();
