const path = require('path')

const writeToFile = require('../lib/includes/writeToFile.js')

export const createPackageJson = (filePath, pkg) =>
  writeToFile(path.resolve(`./${filePath}`), JSON.stringify(pkg))

export const MANIFEST = {
  vendor: 'test',
  name: 'releasy',
  version: '0.3.0',
  description:
    'CLI tool to release node applications with tag and auto semver bump',
  scripts: {
    prereleasy: 'echo pre',
    postreleasy: 'echo post',
  },
}
