const { EOL } = require('os')
const fs = require('fs')

const semver = require('semver')

const writeToFile = require('../includes/writeToFile')

module.exports = function (filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Version file not found: ${filePath}`)
  }

  this.filePath = filePath

  function getRegexFor(attributeName) {
    return new RegExp(
      `\\[assembly:\\s*${attributeName}\\s*\\(\\s*"(.+)"\\s*\\)\\s*\\]`,
      'g'
    )
  }

  function getPredominantLineEnding(text) {
    let crlfs = text.match(/\r\n/g)

    crlfs = crlfs ? crlfs.length : 0

    let lfs = text.match(/n/g)

    lfs = lfs ? lfs.length : 0
    lfs -= crlfs

    if (crlfs === lfs) return EOL
    if (lfs > crlfs) return '\n'

    return '\r\n'
  }

  function replaceOrAppend(text, attributeName, replacement) {
    const pattern = getRegexFor(attributeName)

    return pattern.test(text)
      ? text.replace(pattern, replacement)
      : appendAttribute(text, replacement)
  }

  function appendAttribute(text, attribute) {
    const lineEnding = getPredominantLineEnding(text)

    if (text[text.length - 1] === '\n') return text + attribute + lineEnding

    return text + lineEnding + attribute + lineEnding
  }

  this.readVersion = function () {
    const assemblyInfo = fs.readFileSync(this.filePath).toString()
    let versionMatch = getRegexFor('AssemblyInformationalVersion').exec(
      assemblyInfo
    )

    if (versionMatch === null)
      versionMatch = getRegexFor('AssemblyFileVersion').exec(assemblyInfo)
    if (versionMatch === null)
      versionMatch = getRegexFor('AssemblyVersion').exec(assemblyInfo)
    if (versionMatch === null)
      throw new Error(
        `Could not find version information in file ${this.filePath}`
      )

    return semver(versionMatch[1])
  }

  this.readName = () => {
    throw new Error(
      'Adding name was not implemented for C#... But PR are always welcome :/'
    )
  }

  this.writeVersion = function (newVersion) {
    newVersion = newVersion.format ? newVersion.format() : newVersion
    const indexOfPrerelease = newVersion.indexOf('-')
    const versionWithoutPrerelease =
      indexOfPrerelease > 0
        ? newVersion.substr(0, indexOfPrerelease)
        : newVersion

    let assemblyInfo = fs.readFileSync(this.filePath).toString()

    assemblyInfo = replaceOrAppend(
      assemblyInfo,
      'AssemblyVersion',
      `[assembly: AssemblyVersion("${versionWithoutPrerelease}")]`
    )

    assemblyInfo = replaceOrAppend(
      assemblyInfo,
      'AssemblyFileVersion',
      `[assembly: AssemblyFileVersion("${versionWithoutPrerelease}")]`
    )

    assemblyInfo = replaceOrAppend(
      assemblyInfo,
      'AssemblyInformationalVersion',
      `[assembly: AssemblyInformationalVersion("${newVersion}")]`
    )

    writeToFile(this.filePath, assemblyInfo)
  }
}

module.exports.supports = function (filePath) {
  return /\.cs$/.test(filePath)
}
