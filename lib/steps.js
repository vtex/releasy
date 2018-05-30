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
    getOptionsFile: function () {
        var possibleFiles = ['_releasy.yaml', '_releasy.yml', '_releasy.json'];
        for (var i = 0; i < possibleFiles.length; i++) {
            var name = possibleFiles[i];
            if (test('-e', name))
                return yaml.safeLoad(cat(name));
        }
        return {};
    },
    pickVersionProvider: function (fileName, overrideProviders) {
        var currentProviders = overrideProviders || providers;
        for (var i in currentProviders) {
            var provider = currentProviders[i];
            if (provider.supports(fileName)) {
                return new provider(fileName);
            }
        }

        throw new Error(util.format("Unable to find a provider that supports '%s' as a version file", fileName));
    },
    setup: function (versionProvider, type, prerelease) {
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
            var incrementType = type === 'prerelease'
                || prerelease === 'stable'
                || version.prerelease.length === 0
                ? type || 'patch'
                : ('pre' + type) || 'prepatch'
            version = version.inc(incrementType);
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
    scripts: function (msg, config, key) {
        var pkg = /package\.json$/.test(config.versionProvider.filePath);
        var manifest = /manifest\.json$/.test(config.versionProvider.filePath);

        if (!(pkg || manifest)) return Q();
        try {
            var cmd = config.versionProvider.getScript(key);
        }
        catch (err) {
            return Q();
        }
        return cmd ?
            steps.spawn(cmd, msg, config.dryRun, config.quiet)
            : Q();
    },
    preReleasy: function (config) {
        var msg = 'Pre releasy';
        return steps.status(config)
            .then(function (stdout) {
                if (!config.dryRun && stdout[0].indexOf('nothing to commit') === -1) {
                    throw '\nPlease commit your changes before proceeding.';
                } else {
                    return Q();
                }
            })
            .then(function () { return steps.scripts(msg, config, 'prereleasy'); })
            .then(function () { return steps.status(config); })
            .then(function (stdout) {
                if (stdout[0].indexOf('nothing to commit') > -1) return Q();
                var cmd = config.versionProvider.getScript('prereleasy');
                var preCfg = {
                    commitMessage: 'Pre releasy commit\n\n' + cmd,
                    dryRun: config.dryRun,
                    versionProvider: {
                        filePath: '.'
                    },
                    quiet: true
                };
                return steps.commit(preCfg);
            });
    },
    run: function (cmd, successMessage, dryRun, quiet) {
        var promise = dryRun ? Q() : Q.nfcall(exec, cmd);
        if (successMessage) promise.then(function (stdout) {
            if (!quiet) console.log(successMessage + " > ".blue + cmd.blue);
            return stdout;
        });
        return promise;
    },
    spawn: function (cmd, successMessage, dryRun, quiet) {
        var deferred = Q.defer();
        deferred.promise.then(function () {
            if (!quiet) console.log(successMessage + " > ".blue + cmd.blue);
        });
        if (dryRun) {
            deferred.resolve();
            return deferred.promise;
        }
        var childEnv = Object.create(process.env);
        var childIO = quiet ? null : 'inherit';
        var argsW32 = false;
        if (/^(?:[A-Z]*_*)*[A-Z]*=/.test(cmd) && !dryRun) {
            var env = cmd.split('=');
            childEnv[env[0]] = env[1].split(' ')[0];
        }
        if (process.platform === 'win32') {
            var argsCmd = env ? env[1].substr(env[1].indexOf(' ') + 1) : cmd;
            var args = ['/s', '/c', argsCmd]
            var command = 'cmd.exe';
            argsW32 = true;
        } else {
            var args = env ? env[1].split(' ').slice(1) : cmd.split(' ');
            var command = args.shift();
        }
        var childProcess = spawn(command, args, { env: childEnv, stdio: childIO, windowsVerbatimArguments: argsW32 });
        childProcess.on('close', function (code) {
            if (code === 0) deferred.resolve();
            else deferred.reject('\nCommand exited with error code: ' + code);
        });
        return deferred.promise;
    },
    status: function (config) {
        return steps.run('git status', '', false, config.quiet).then(function (stdout) {
            return stdout;
        });
    },
    bump: function (config) {
        // Update version on CHANGELOG.md 
        if (fs.existsSync(config.changelogPath)) {
            const data = fs.readFileSync(config.changelogPath, err => {
                if (err) throw `Error reading file: ${err}`;
            }).toString()
            if (data.indexOf(config.unreleased) < 0) {
                console.log("I can't update your CHANGELOG. :( \
                  \nMake your CHANGELOG great again and follow the CHANGELOG format http://keepachangelog.com/en/1.0.0/".red.bold)
            } else {
                const position = data.indexOf(config.unreleased) + config.unreleased.length;
                const bufferedText = Buffer.from(`${config.changelogVersion}${data.substring(position)}`);
                const file = fs.openSync(config.changelogPath, 'r+');
                fs.writeSync(file, bufferedText, 0, bufferedText.length, position, err => {
                    if (err) throw `Error writing file: ${err}`;
                    fs.close(file);
                });
            }
        }

        var promise = config.dryRun ? Q() : Q(config.versionProvider.writeVersion(config.newVersion));
        return promise.then(result => {
            if (!config.quiet) console.log(`Version bumped to ${config.newVersion.bold.green}`);
            return result;
        });
    },
    commit: function (config) {
        return steps.run(`git commit -am "${config.commitMessage}"`, 'Files committed',
            config.dryRun, config.quiet);
    },
    tag: function (config) {
        return steps.run(`git tag ${config.tagName} -m "${config.tagMessage}"`,
            `Tag created: ${config.tagName}`, config.dryRun, config.quiet);
    },
    push: function (config) {
        let promise = steps.run('git version', '', config.dryRun, config.quiet).then(stdout => {
            let gitPushCommand = 'git push && git push --tags';
            if (/(git version 1\.8\.3)|(git version 1\.8\.4)/.test(stdout)) {
                gitPushCommand = 'git push --follow-tags';
            }
            // Post Release Notes at the github
            if (fs.existsSync(config.changelogPath) && config.githubAuth) {
                const releaseNotes = "curl -H " + config.githubAuth + " -X POST --data '"
                    + JSON.stringify(config.release) + "' " + config.githubUrl
                steps.run(releaseNotes, 'Post Release Notes', config.dryRun, config.quiet).then(err => {
                    if (err) throw `Error on request ${err}`
                })
                // Tag already exists in the remote
                gitPushCommand = 'git push';
            }
            return gitPushCommand;
        });
        promise = promise.then(gitPushCommand => {
            return steps.run(gitPushCommand, 'Pushed commit and tags', config.dryRun, config.quiet)
        });
        return promise;
    },
    postReleasy: function (config) {
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
        promise.then(function () {
            return steps.bump(config)
        });
        if (options.commit) {
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
            .then(function () {
                return steps.postReleasy(config)
            })
            .then(function () {
                if (!config.quiet) console.log("All steps finished successfully.");
            });
        promise.fail(function (reason) {
            if (!config.quiet) console.log("Failed to release.", reason);
        });
        return promise;
    }
};

module.exports = steps;
