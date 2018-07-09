var semver = require('semver')
var { cat } = require('shelljs')

const checkVersionFiles = filePath => {
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
    const pkgVersion = semver(pkg.version, true)
    // When filePath has two files, return higher version
    if (this.filePath.length === 2) {
      const mnft = JSON.parse(cat(this.filePath[1]))
      const mnftVersion = semver(mnft.version, true)
      return semver.lt(pkgVersion.format(), mnftVersion.format()) ? mnftVersion : pkgVersion
    }
    return pkgVersion
  }

  this.writeVersion = newVersion => {
    for (const i in this.filePath) {
      const pkg = JSON.parse(cat(this.filePath[i]))
      pkg.version = newVersion.format ? newVersion.format() : newVersion

      const pkgJson = `${JSON.stringify(pkg, null, 2)}\n`
      pkgJson.to(this.filePath[i])
    }
  }

  this.getScript = script => {
    for (const f in this.filePath) {
      var scripts = JSON.parse(cat(this.filePath[f])).scripts
      var cmd = (scripts && scripts[script]) ? scripts[script] : null
    }
    return cmd
  }
}

module.exports.supports = function (filePath) {
  return /\.json$/.test(filePath)
}
