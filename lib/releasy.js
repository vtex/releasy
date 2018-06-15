var steps = require('./steps')
var prompt = require('prompt')
var execSync = require('child_process').execSync
var fs = require('fs')

module.exports = function (opts) {
  // Expose this to unit testing
  _this = this
  this.steps = opts.steps || steps
  this.promise = undefined

  var versionProvider = this.steps.pickVersionProvider(opts.filename)

  var config = this.steps.setup(versionProvider, opts.type, opts.stable ? 'stable' : opts['tagName'])
  if (!opts.quiet) {
    console.log(`Old version: ${config.oldVersion.bold}`)
    console.log(`New version: ${config.newVersion.bold.yellow}`)
  }

  const [month, day, year] = new Date().toLocaleDateString('en-US').split('/')
  // Pachamama v2 requires that version tags start with a 'v' character.
  config.tagName = `v${config.newVersion}`
  config.commitMessage = `Release ${config.tagName}`
  config.tagMessage = `Release ${config.tagName}`
  config.npmTag = opts.npmTag
  config.npmFolder = opts.npmFolder
  config.dryRun = opts.dryRun
  config.quiet = opts.quiet
  config.unreleased = '## [Unreleased]'
  config.changelogPath = 'CHANGELOG.md'
  config.githubAuth = getGithubToken()
  config.changelogVersion = `\n\n## [${config.newVersion}] - ${year}-${month}-${day}`
  config.githubInfo = getGithubRepo()
  config.release = {
    name: config.tagName,
    tag_name: config.tagName,
    body: getReleaseNotes() || ' ',
    draft: false,
    prerelease: false,
  }

  /**
     * Get and format GITHUB_API_TOKEN.
     * @return Github Authorization
    */
  function getGithubToken() {
    if (process.env.GITHUB_API_TOKEN) {
      return process.env.GITHUB_API_TOKEN
    }
    if (!config.quiet) {
      console.log('You must set GITHUB_API_TOKEN env if you want to post the Release Notes of your project.\
    \nAccess https://github.com/settings/tokens/new to create a Personal Token.\
    \nCheck the settings section in README for details.'.yellow.bold)
    }
  }

  /**
   * Get information in CHANGELOG.md about
   * new version that will be released.
   * @return release notes between versions
  */
  function getReleaseNotes() {
    if (!fs.existsSync(config.changelogPath)) {
      if (!config.quiet) console.log('Create a CHANGELOG.md if you want a Release Notes in your Github Project'.red.bold)
      return
    }
    const data = fs.readFileSync(config.changelogPath, err => {
      if (err)throw `Error reading file: ${err}`
    }).toString()
    if (data.indexOf(config.unreleased) < 0) {
      if (!config.quiet) {
        console.log("I can't post your Release Notes. :(\
        \nMake your CHANGELOG great again and follow the CHANGELOG format http://keepachangelog.com/en/1.0.0/".yellow.bold)
      }
      return
    }
    const unreleased = data.indexOf(config.unreleased) + config.unreleased.length
    const oldVersion = data.indexOf(config.oldVersion) - 4
    return oldVersion < 0
      ? data.substring(unreleased)
      : data.substring(unreleased, oldVersion)
  }

  /**
   * Get information about org and repo name
   * @return array with git organization and repo
  */
  function getGithubRepo() {
    return execSync('git remote show origin -n | grep "Fetch URL:" | cut -d ":" -f2 -f3')
      .toString().trim()
      .replace('.git', '')
      .split(':')[1]
      .split('/')
      .slice(-2)
  }
  // No prompt necessary, release and finish.
  if (!opts.cli || opts.silent) {
    this.promise = this.steps.release(config, opts)
    return this
  }

  // User wants a confirmation prompt
  prompt.start()
  var property = {
    name: 'confirm',
    type: 'string',
    description: 'Are you sure?'.green,
    default: 'yes',
    required: true,
    before: value => {
      return value === 'yes' || value === 'y'
    },
  }

  prompt.get(property, (err, result) => {
    if (err || !result.confirm) {
      return console.log('\nCancelled by user')
    }
    _this.steps.release(config, opts)
  })

  return this
}
