var semver = require('semver')
var { cat } = require('shelljs')

module.exports = function (filePath) {
  this.filePath = filePath
  var manifestPath = filePath.replace(/(.*\/)?(.*)(.json)$/, '$1manifest$3')
  var hasManifest = test('-e', manifestPath)

  try {
    var pkg = JSON.parse(cat(filePath))
    if (pkg.version === null || pkg.private) {
      if (!hasManifest) {
        throw new Error('Null version or private flag detected and manifest.json not found')
      }
      console.log('Null version or private flag detected, switching to manifest.json')
      this.filePath = manifestPath
    }
  } catch (e) {
    if (!hasManifest) {
      console.log(`Version file not found: ${filePath}`)
      console.log(e.message)
      process.exit()
    }
    console.log(`${filePath} not found, switching to manifest.json`)
    this.filePath = manifestPath
  }

  this.readVersion = () => {
    const pkg = JSON.parse(cat(this.filePath))
    return semver(pkg.version, true)
  }

  this.writeVersion = newVersion => {
    const pkg = JSON.parse(cat(this.filePath))
    pkg.version = newVersion.format ? newVersion.format() : newVersion

    const pkgJson = `${JSON.stringify(pkg, null, 2)}\n`
    pkgJson.to(this.filePath)
  }

  this.getScript = script => {
    const scripts = JSON.parse(cat(this.filePath)).scripts
    return (scripts && scripts[script]) ? scripts[script] : null
  }
}

module.exports.supports = function (filePath) {
  return /\.json$/.test(filePath)
}
