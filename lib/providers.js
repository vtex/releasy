const path = require('path')

const { ls } = require('shelljs')

const folder = `${path.dirname(module.filename)}/providers`
const files = ls(folder)

// eslint-disable-next-line node/global-require
module.exports = files.map((file) => require(`./providers/${file}`))
