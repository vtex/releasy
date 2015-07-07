require('shelljs/global');
var Q = require('q');
var util = require('util');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var fs = require('fs');
var path = require('path');
var semver = require('semver');
var yaml = require('js-yaml');
var providers = require('./providers.js');

var steps = {
    getOptionsFile: function() {
        var possibleFiles = [ '_releasy.yaml', '_releasy.yml', '_releasy.json'];
        for (var i = 0; i < possibleFiles.length; i++) {
            var name = possibleFiles[i];
            if (test('-e', name))
                return yaml.safeLoad(cat(name));
        }
        return {};
    },
    pickVersionProvider: function(fileName, overrideProviders) {
        if (!test('-e', fileName)) {
            throw new Error(util.format("Version file not found: %s", fileName));
        }

        var currentProviders = overrideProviders || providers;
        for (var i in currentProviders) {
            var provider = currentProviders[i];
            if (provider.supports(fileName)) {
                return new provider(fileName);
            }
        }

        throw new Error(util.format("Unable to find a provider that supports '%s' as a version file", fileName));
    },
    setup: function(versionProvider, type, prerelease) {
        var version = versionProvider.readVersion();
        // Support for "promote" predicate, which bumps prerelease to stable, without changing version number.
        if (type === 'promote') {
            // Promote only makes sense when there is a prerelease
            if (version.prerelease.length === 0) {
                throw new Error("The version you are trying to promote to stable (" + version.format() + ") is already stable.\n")
            }
            else {
                version.prerelease = [];
                prerelease = 'stable';
            }
        }
        // For other types, simply increment
        else {
            version = version.inc(type || 'patch');
        }
        if (prerelease && prerelease !== 'stable' && type != 'prerelease') {
            version.prerelease = [prerelease];
        }
        return {
            versionProvider: versionProvider,
            newVersion: version.format(),
            oldVersion: versionProvider.readVersion().format()
        };
    },
    scripts: function(msg, config, key) {
        var pkg = config.versionProvider.filePath === 'package.json',
            meta = config.versionProvider.filePath === 'meta.json',
            validFile = pkg || meta;

        if (!validFile) return Q();
        var cmd = JSON.parse(cat('package.json')).scripts[key];
        return cmd ?
            steps.spawn(cmd, msg, config.dryRun, config.quiet)
            : Q();
    },
    preReleasy: function(config) {
        var msg = 'Pre releasy';
        return steps.status(config)
            .then(function(stdout) {
                if (stdout[0].indexOf('nothing to commit') > -1) return Q();
                // Clone object
                var preCfg = JSON.parse(JSON.stringify(config));
                preCfg.versionProvider.filePath = '.';
                config.commitMessage = 'Pre releasy commit'
                preCfg.quiet = true;
                return steps.commit(preCfg);
            })
            .then(function() {
                return steps.scripts(msg, config, 'prereleasy');
            });
    },
    run: function(cmd, successMessage, dryRun, quiet){
        var promise = dryRun ? Q() : Q.nfcall(exec, cmd);
        if (successMessage) promise.then(function(stdout) {
            if (!quiet) console.log(successMessage + " > ".blue + cmd.blue);
            return stdout;
        });
        return promise;
    },
    spawn: function(cmd, successMessage, dryRun, quiet) {
        var deferred = Q.defer(),
            args = [];
        deferred.promise.then(function() {
            if (!quiet) console.log(successMessage + " > ".blue + cmd.blue);
        });
        cmdArr = cmd.split(' ');
        if (cmd.length > 1) args = cmdArr.splice(1, cmd.length);
        if (dryRun) {
            deferred.resolve();
            return deferred.promise;
        }
        var childProcess = spawn(cmdArr[0], args, { stdio: 'inherit' });
        childProcess.on('close', function(code) {
            if (code === 0) {
                deferred.resolve();
            } else {
                deferred.reject('\nCommand exited with error code: ' + code);
            }
        });
        return deferred.promise;
    },
    status: function(config) {
        return steps.run('git status', config.dryRun, config.quiet).then(function(stdout) {
            return stdout;
        });
    },
    bump: function (config) {
        var promise = config.dryRun ? Q() : Q(config.versionProvider.writeVersion(config.newVersion));
        return promise.then(function(result){
            if (!config.quiet) console.log('Version bumped to ' + config.newVersion.bold.green);
            return result;
        });
    },
    add: function (config) {
        return steps.run('git add ' + config.versionProvider.filePath,
            'File ' + config.versionProvider.filePath + ' added', config.dryRun, config.quiet);
    },
    commit: function (config) {
        return steps.run('git commit ' + config.versionProvider.filePath + ' -m "' + config.commitMessage + '"',
            'File ' + config.versionProvider.filePath + ' committed', config.dryRun, config.quiet);
    },
    tag: function (config) {
        return steps.run('git tag ' + config.tagName + ' -m "' + config.tagMessage + '"',
            'Tag created: ' + config.tagName, config.dryRun, config.quiet);
    },
    push: function (config) {
        var promise = steps.run('git version', '', config.dryRun, config.quiet).then(function(stdout){
            var gitPushCommand = 'git push && git push --tags';
            if (/(git version 1\.8\.3)|(git version 1\.8\.4)/.test(stdout)){
              gitPushCommand = 'git push --follow-tags';
            }
            return gitPushCommand;
        });
        promise = promise.then(function(gitPushCommand){
            return steps.run(gitPushCommand, 'Pushed commit and tags', config.dryRun, config.quiet)
        });
        return promise;
    },
    postReleasy: function(config) {
        var msg = 'Post releasy';
        return steps.scripts(msg, config, 'postreleasy');
    },
    publish: function (config) {
        var cmd = 'npm publish';
        var msg = 'Published ' + config.newVersion + ' to npm';
        if (config.npmTag) {
            cmd += ' --tag ' + config.npmTag;
            msg += ' with a tag of "' + config.npmTag + '"';
        }
        if (config.npmFolder) {
            cmd += ' ' + config.npmFolder
        }
        return steps.run(cmd, msg, config.dryRun, config.quiet);
    },
    release: function (config, options) {
      if (!config.quiet) console.log("Starting release...");
      var promise = steps.preReleasy(config);
      promise.then(function() {
          return steps.bump(config)
      });
      if (options.commit) {
        promise = promise.then(function () {
          return steps.add(config)
        });
        promise = promise.then(function () {
          return steps.commit(config)
        });
      }
      if (options.tag) {
        promise = promise.then(function () {
          return steps.tag(config)
        });
      }
      if (options.push) {
        promise = promise.then(function () {
          return steps.push(config)
        });
      }
      if (options.npm) {
        promise = promise.then(function () {
          return steps.publish(config)
        });
      }
      promise = promise
          .then(function() {
              return steps.postReleasy(config)
          })
          .then(function() {
              if (!config.quiet) console.log("All steps finished successfuly.");
          });
      promise.fail(function(reason){
        if (!config.quiet) console.log("Failed to release.", reason);
      });
      return promise;
    }
};

module.exports = steps;
