var semver = require('semver');
var path = require('path');
require('shelljs/global');

module.exports = function(filePath) {
	this.filePath = filePath;

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