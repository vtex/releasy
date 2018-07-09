#!/usr/bin/env node
var program = require('commander')
var Releasy = require('../lib/releasy')
var camelCase = require('camelcase')
var pkg = require('../package.json')
var steps = require('../lib/steps')

var optionsFile = steps.getOptionsFile()

var type = optionsFile.type || 'patch'
var args = process.argv
if (['major', 'minor', 'patch', 'promote', 'prerelease', 'pre'].indexOf(args[2]) !== -1) {
  type = args[2]
  if (type === 'pre') type = 'prerelease'
  console.log('Release:', type)

  args = args.slice(0, 2).concat(args.slice(3))
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
  .option('--notes', 'Publish notes to GitHub Release Notes. Personal Token is required to use this option')
  .option('-n, --npm', 'Publish to npm')
  .option('-d, --dry-run', 'Dont do anything, just show what would be done')
  .option('-s, --silent', 'Dont ask for confirmation')
  .option('-q, --quiet', "Don't write messages to console")
  .parse(args)

var defaults = {
  'filename': 'package.json',
  'tag-name': 'beta',
  'npm-tag': '',
  'folder': '',
  'stable': false,
  'no-commit': false,
  'no-tag': false,
  'no-push': false,
  'notes': false,
  'npm': false,
  'dry-run': false,
  'silent': false,
  'quiet': false,
}

for (const key in defaults) {
  const ccKey = camelCase(key)
  program[ccKey] = program[ccKey] || optionsFile[key] || defaults[key]
}

program.type = type
program.cli = true

try {
  return new Releasy(program)
} catch (error) {
  console.error(error.message.red)
  exit(1)
}
