#!/usr/bin/env node
const program = require('commander')
const camelCase = require('camelcase')

const releasy = require('../lib/releasy')
const pkg = require('../package.json')
const steps = require('../lib/steps')

const optionsFile = steps.getOptionsFile()

let type = optionsFile.type || 'patch'
let args = process.argv

if (
  ['major', 'minor', 'patch', 'promote', 'prerelease', 'pre'].indexOf(
    args[2]
  ) !== -1
) {
  type = args[2]
  if (type === 'pre') type = 'prerelease'
  console.log('Release:', type)

  args = args.slice(0, 2).concat(args.slice(3))
}

program
  .version(pkg.version)
  .usage('(major|minor|*patch*|prerelease) [options]')
  .option('-f, --filename [path]', 'Your package manifest file', 'package.json')
  .option('-t, --tag-name [tag]', 'The prerelease tag in your version', 'beta')
  .option('--npm-tag [tag]', 'Tag option for npm publish', '')
  .option('-f, --folder [folder]', 'Folder option for npm publish', '')
  .option('--otp [code]', 'One-time password code for npm publish')
  .option('--stable', 'Mark this as a relese stable (no prerelease tag)', false)
  .option('--no-commit', 'Do not commit the version change', false)
  .option('--no-tag', 'Do not tag the version change', false)
  .option('--no-push', 'Do not push changes to remote', false)
  .option(
    '--display-name',
    'Add the project name to the tag and release commit',
    false
  )
  .option(
    '--notes',
    'Publish notes to GitHub Release Notes. Personal Token is required to use this option',
    false
  )
  .option('-n, --npm', 'Publish to npm', false)
  .option(
    '-d, --dry-run',
    'Dont do anything, just show what would be done',
    false
  )
  .option('-s, --silent', 'Dont ask for confirmation', false)
  .option('-q, --quiet', "Don't write messages to console", false)
  .parse(args)

for (let [key, value] of Object.entries(optionsFile)) {
  if (key.startsWith('no-')) {
    key = key.slice(3, key.length)
    value = !value
  }

  program[camelCase(key)] = value
}

program.type = type
program.cli = true

releasy(program)
