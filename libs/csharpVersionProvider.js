require('shelljs/global');
var semver = require('semver');

module.exports = function(filePath) {
  this.filePath = filePath;

  function getRegexFor(attributeName) {
    return new RegExp('\\[assembly:\\s*' + attributeName + '\\s*\\(\\s*"(.+)"\\s*\\)\\s*\\]', 'g');
  }

  function getPredominantLineEnding(text) {
    var crlfs = text.match(/\r\n/g);
    crlfs = crlfs ? crlfs.length : 0;

    var lfs = text.match(/n/g);
    var lfs = lfs ? lfs.length : 0;
    lfs = lfs - crlfs;

    if (crlfs == lfs) return require('os').EOL;
    if (lfs > crlfs) return '\n';
    else return '\r\n';
  }

  function replaceOrAppend(text, attributeName, replacement) {
    var pattern = getRegexFor(attributeName);
    return pattern.test(text)
      ? text.replace(pattern, replacement)
      : appendAttribute(text, replacement);
  }

  function appendAttribute(text, attribute) {
    var lineEnding = getPredominantLineEnding(text);
    if(text[text.length-1] == '\n')
      return text + attribute + lineEnding;
    else
      return text + lineEnding + attribute + lineEnding;
  }

  this.readVersion = function() {
    var assemblyInfo = cat(this.filePath);
    var versionMatch = getRegexFor('AssemblyInformationalVersion').exec(assemblyInfo);
    if (versionMatch === null)
      versionMatch = getRegexFor('AssemblyFileVersion').exec(assemblyInfo);
    if (versionMatch === null)
      versionMatch = getRegexFor('AssemblyVersion').exec(assemblyInfo);
    if (versionMatch === null)
      throw new Error("Could not find version information in file " + this.filePath);

    return semver(versionMatch[1]);
  };

  this.writeVersion = function(newVersion) {
    newVersion = newVersion.format ? newVersion.format() : newVersion;
    var indexOfPrerelease = newVersion.indexOf('-');
    var versionWithoutPrerelease = indexOfPrerelease > 0
      ? newVersion.substr(0, indexOfPrerelease)
      : newVersion;
    var assemblyInfo = cat(this.filePath);

    assemblyInfo = replaceOrAppend(assemblyInfo, 'AssemblyVersion',
      '[assembly: AssemblyVersion("' + versionWithoutPrerelease + '")]');

    assemblyInfo = replaceOrAppend(assemblyInfo, 'AssemblyFileVersion',
      '[assembly: AssemblyFileVersion("' + versionWithoutPrerelease + '")]');

    assemblyInfo = replaceOrAppend(assemblyInfo, 'AssemblyInformationalVersion',
      '[assembly: AssemblyInformationalVersion("' + newVersion + '")]');

    assemblyInfo.to(this.filePath);
  };
}
