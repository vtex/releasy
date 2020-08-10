const { writeFileSync } = require('fs')

module.exports = (path, content) =>
  writeFileSync(path, content, {
    encoding: 'UTF-8',
  })
