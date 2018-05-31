require('shelljs/global');
var path = require('path');

module.exports = (() => {
  let folder = path.dirname(module.filename) + '/providers';
  let files = ls(folder);
  let modules = [];
  files.forEach(file => {
    modules.push(require('./providers/' + file));
  })
  return modules;
})();
