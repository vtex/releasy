const semver = require('semver')
const { cat, test } = require('shelljs')

const writeToFile = require('../includes/writeToFile')

const checkVersionFiles = (filePath) => {
  const packagePath = filePath
  const manifestPath = filePath.replace(/(.*\/)?(.*)(.json)$/, '$1manifest$3')
  const hasManifest = test('-e', manifestPath)
  const filesPath = []

  try {
    const pkg = JSON.parse(cat(packagePath))

    if (pkg.version !== null && !pkg.private) filesPath.push(packagePath)
    if (hasManifest) filesPath.push(manifestPath)
  } catch (e) {
    if (!hasManifest) {
      console.log(e.message)
      throw new Error(`Version file not found: ${filePath}`)
    }

    filesPath.push(manifestPath)
  }

  return filesPath
}

module.exports = function (filePath) {
  this.filePath = checkVersionFiles(filePath)

  this.readVersion = () => {
    const pkg = JSON.parse(cat(this.filePath[0]))

    if (!pkg.version)
      throw new Error(
        `Your package.json file is missing the version property. If you don't need it, you can add 'version: 0.0.0' and we gonna use the version on the manifest instead!`
      )
    const pkgVersion = semver(pkg.version, true)

    // When filePath has two files, return higher version
    if (this.filePath.length === 2) {
      const mnft = JSON.parse(cat(this.filePath[1]))
      const mnftVersion = semver(mnft.version, true)

      return semver.lt(pkgVersion.format(), mnftVersion.format())
        ? mnftVersion
        : pkgVersion
    }

    return pkgVersion
  }

  this.readName = () => {
    const pkg = JSON.parse(cat(this.filePath[0]))

    if (!pkg.name)
      throw new Error('Your versioning file is missing the name property.')

    // When filePath has two files, return the name from manifest with vendor if exists
    if (this.filePath.length === 2) {
      const mnft = JSON.parse(cat(this.filePath[1]))

      if (mnft.name && mnft.vendor) {
        return `${mnft.vendor}.${mnft.name}`
      }

      if (mnft.name) {
        return mnft.name
      }
    }

    return pkg.name
  }

  this.writeVersion = (newVersion) => {
    for (const i in this.filePath) {
      const pkg = JSON.parse(cat(this.filePath[i]))

      pkg.version = newVersion.format ? newVersion.format() : newVersion

      const pkgJson = `${JSON.stringify(pkg, null, 2)}\n`

      writeToFile(this.filePath[i], pkgJson)
    }
  }

  this.getScript = (script) => {
    let cmd

    for (const f in this.filePath) {
      const { scripts } = JSON.parse(cat(this.filePath[f]))

      cmd = scripts && scripts[script] ? scripts[script] : null
    }

    return cmd
  }
}

module.exports.supports = function (filePath) {
  return /\.json$/.test(filePath)
}
