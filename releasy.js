#!/usr/bin/env node
var prompt = require('prompt'),
    program = require('commander'),
    steps = require('./libs/steps');

var type = 'patch';
var arguments = process.argv;
if (['major', 'minor', 'patch', 'promote'].indexOf(arguments[2]) != -1) {
    type = arguments[2];
    console.log("Release:", type);
    arguments = arguments.slice(0, 2).concat(arguments.slice(3));
}

program.version('1.0.0')
    .usage('(major|minor|*patch*) [options]')
    .option('-f, --filename [path]', 'Your package manifest file [package.json]', 'package.json')
    .option('-t, --tag-name [tag]', 'The prerelease tag in your version [beta]', 'beta')
    .option('--npm-tag [tag]', 'Tag option for npm publish', '')
    .option('-f, --folder [folder]', 'Folder option for npm publish', '')
    .option('--stable', 'Mark this as a relese stable (no prerelease tag)')
    .option('--no-commit', 'Do not commit the version change')
    .option('--no-tag', 'Do not tag the version change')
    .option('--no-push', 'Do not push changes to remote')
    .option('-n, --npm', 'Publish to npm')
    .option('-d, --dry-run', 'Dont do anything, just show what would be done')
    .option('-s, --silent', 'Dont ask for confirmation')
    .parse(arguments);

var config = steps.setup(program.filename, type, program.stable ? 'stable' : program.tagName);
console.log("Old version: " + config.pkg.version.bold);
console.log("New version: " + config.newVersion.bold.yellow);

// Pachamama v2 requires that version tags start with a 'v' character.
config.tagName = 'v' + config.newVersion;
config.commitMessage = 'Release ' + config.tagName;
config.tagMessage = 'Release ' + config.tagName;
config.npmTag = program.npmTag;
config.npmFolder = program.npmFolder;
config.dryRun = program.dryRun;

var release = function (config, options) {
    console.log("Starting release...");
    var promise = steps.bump(config);
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
    promise = promise.then(function(){
       console.log("All steps finished successfuly.");
    });
    promise.fail(function(reason){
      console.log("Failed to release.", reason);
    });
    return promise;
};

if (program.silent) {
    release(config, program);
}
else {
    prompt.start();
    var property = {
        name: 'confirm',
        type: 'string',
        description: 'Are you sure?'.green,
        default: 'yes',
        required: true,
        before: function (value) {
            return value === 'yes' || value === 'y';
        }
    };

    prompt.get(property, function (err, result) {
        if (err || !result.confirm) {
            return console.log("Cancelled by user");
        }
        return release(config, program);
    });
}