require('shelljs/global');
var semver = require('semver');

module.exports = function(filePath) {
  this.filePath = filePath;

  var versionRegex = /^\s*\[assembly:\s*AssemblyVersion\s*\(\s*"(.+)"\s*\)\s*\]/m
  var fileVersionRegex = /^\s*\[assembly:\s*AssemblyFileVersion\s*\(\s*"(.+)"\s*\)\s*\]/m
  var infoVersionRegex = /^\s*\[assembly:\s*AssemblyInformationalVersion\s*\(\s*"(.+)"\s*\)\s*\]/m

  function replaceOrAppend(text, pattern, replacement) {
    return pattern.test(text)
      ? text.replace(pattern, replacement)
      : text + '\n' + replacement
  }

  this.readVersion = function() {
    var assemblyInfo = cat(this.filePath);
    var versionMatch = infoVersionRegex.exec(assemblyInfo);
    if (versionMatch === null)
      versionMatch = fileVersionRegex.exec(assemblyInfo);
    if (versionMatch === null)
      versionMatch = versionRegex.exec(assemblyInfo);
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

    assemblyInfo = replaceOrAppend(assemblyInfo, versionRegex,
      '[assembly: AssemblyVersion("' + versionWithoutPrerelease + '")]');

    assemblyInfo = replaceOrAppend(assemblyInfo, fileVersionRegex,
      '[assembly: AssemblyFileVersion("' + versionWithoutPrerelease + '")]');

    assemblyInfo = replaceOrAppend(assemblyInfo, infoVersionRegex,
      '[assembly: AssemblyInformationalVersion("' + newVersion + '")]');

    assemblyInfo.to(this.filePath);
  };
}
