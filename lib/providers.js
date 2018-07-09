var { ls } = require('shelljs')
var path = require('path')

module.exports = (() => {
  const folder = `${path.dirname(module.filename)}/providers`
  const files = ls(folder)
  const modules = []
  files.forEach(file => {
    modules.push(require(`./providers/${file}`))
  })
  return modules
})()
