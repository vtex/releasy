#!/usr/bin/env node
var program = require('commander'),
  Releasy = require('../libs/releasy'),
  pkg = require('../package.json'),
  steps = require('../libs/steps');

var optionsFile = steps.getOptionsFile();

var type = optionsFile.type || 'patch';
var arguments = process.argv;
if (['major', 'minor', 'patch', 'promote', 'prerelease', 'pre'].indexOf(arguments[2]) != -1) {
  type = arguments[2];
  if (type === 'pre') type = 'prerelease';
  console.log("Release:", type);
  
  arguments = arguments.slice(0, 2).concat(arguments.slice(3));
}

program.version(pkg.version)
  .usage('(major|minor|*patch*|prerelease) [options]')
  .option('-f, --filename [path]', 'Your package manifest file [package.json]')
  .option('-t, --tag-name [tag]', 'The prerelease tag in your version [beta]')
  .option('--npm-tag [tag]', 'Tag option for npm publish')
  .option('-f, --folder [folder]', 'Folder option for npm publish')
  .option('--stable', 'Mark this as a relese stable (no prerelease tag)')
  .option('--no-commit', 'Do not commit the version change')
  .option('--no-tag', 'Do not tag the version change')
  .option('--no-push', 'Do not push changes to remote')
  .option('-n, --npm', 'Publish to npm')
  .option('-d, --dry-run', 'Dont do anything, just show what would be done')
  .option('-s, --silent', 'Dont ask for confirmation')
  .option('-q, --quiet', "Don't write messages to console")
  .parse(arguments);

var defaults = {
  'filename': 'package.json',
  'tag-name': 'beta',
  'npm-tag': '',
  'folder': '',
  'stable': false,
  'no-commit': false,
  'no-tag': false,
  'no-push': false,
  'npm': false,
  'dry-run': false,
  'silent': false,
  'quiet': false
};

for (var key in defaults)
  program[key] = program[key] || optionsFile[key] || defaults[key];

program.type = type;
program.cli = true;

return new Releasy(program);
