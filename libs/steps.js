var Q = require('q');
var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');
var semver = require('semver');
var steps = {
    setup: function(filename, type, prerelease) {
        var pkg = require(path.resolve('./',filename));
        var newVersion = pkg.version;
        var versionObj;
        // Support for "promote" predicate, which bumps prerelease to stable, without changing version number.
        if (type === 'promote') {
            // Promote only makes sense when there is a prerelease
            if (semver(pkg.version).prerelease.length === 0) {
                throw new Error("The version you are trying to promote to stable (" + pkg.version + ") is already stable.\n")
            }
            else {
                versionObj = semver(pkg.version);
                versionObj.prerelease = [];
                newVersion = versionObj.format();
                prerelease = 'stable';
            }
        }
        // For other types, simply increment
        else {
            newVersion = semver.inc(pkg.version, type || 'patch');
        }
        if (prerelease && prerelease !== 'stable') {
            versionObj = semver(newVersion);
            versionObj.prerelease = [prerelease];
            newVersion = versionObj.format();
        }
        return {filename: filename, pkg: pkg, newVersion: newVersion};
    },
    run: function(cmd, successMessage, dryRun){
        var promise = dryRun ? Q() : Q.nfcall(exec, cmd);
        if (successMessage) promise.then(function(stdout){ console.log(successMessage); return stdout; });
        return promise;
    },
    bump: function (config) {
        config.pkg.version = config.newVersion;
        var promise = config.dryRun ? Q() : Q.nfcall(fs.writeFileSync, config.filename, JSON.stringify(config.pkg, null, 2) + '\n');
        return promise.then(function(result){
            console.log('Version bumped to ' + config.newVersion);
            return result;
        });
    },
    add: function (config) {
        return steps.run('git add ' + config.filename, config.filename + ' added', config.dryRun);
    },
    commit: function (config) {
        return steps.run('git commit ' + config.filename + ' -m "' + config.commitMessage + '"', config.filename + ' committed', config.dryRun);
    },
    tag: function (config) {
        return steps.run('git tag ' + config.tagName + ' -m "' + config.tagMessage + '"', 'New git tag created: ' + config.tagName, config.dryRun);
    },
    push: function (config) {
        return steps.run('git push --tags', 'pushed commit and tags to remote', config.dryRun);
    },
    publish: function (config) {
        var cmd = 'npm publish';
        var msg = 'published ' + config.newVersion + ' to npm';
        if (config.npmTag) {
            cmd += ' --tag ' + config.npmTag;
            msg += ' with a tag of "' + config.npmTag + '"';
        }
        if (config.npmFolder) {
            cmd += ' ' + config.npmFolder
        }
        return steps.run(cmd, msg, config.dryRun);
    }
};

module.exports = steps;