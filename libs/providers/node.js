var semver = require('semver');
var path = require('path');
require('shelljs/global');

module.exports = function(filePath) {
	this.filePath = filePath;
	var pkg = JSON.parse(cat(filePath));
	if (pkg.version === null || pkg.private) {
		var manifest = 'manifest.json';
		if (!test('-e', manifest)) {
		      throw new Error("Null version or private flag detected and manifest.json not found");
		}
		console.log("Null version or private flag detected, switching to manifest.json");
		this.filePath = manifest;
	}

	this.readVersion = function() {
		var pkg = JSON.parse(cat(this.filePath));
		return semver(pkg.version);
	};

	this.writeVersion = function(newVersion) {
		var pkg = JSON.parse(cat(this.filePath));
		pkg.version = newVersion.format ? newVersion.format() : newVersion;

		var pkgJson = JSON.stringify(pkg, null, 2) + '\n';
		pkgJson.to(this.filePath);
	};
};

module.exports.supports = function(filePath) {
  return /\.json$/.test(filePath);
};
