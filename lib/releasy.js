const Steps = require('./steps')
const prompt = require('prompt')
const execSync = require('child_process').execSync
const fs = require('fs')

module.exports = function(opts) {
  // Expose this to unit testing
  let steps = opts.steps || Steps

  const versionProvider = steps.pickVersionProvider(opts.filename)

  const config = steps.setup(
    versionProvider,
    opts.type,
    opts.stable ? 'stable' : opts['tagName']
  )
  if (!opts.quiet) {
    console.log(`Old version: ${config.oldVersion.bold}`)
    console.log(`New version: ${config.newVersion.bold.yellow}`)
  }

  const dateArray = new Date().toLocaleDateString('en-US').split('/')

  const month = dateArray[0] < 10 ? `0${dateArray[0]}` : dateArray[0]
  const day = dateArray[1] < 10 ? `0${dateArray[1]}` : dateArray[1]
  const year = dateArray[2]

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
      console.log(
        'You must set GITHUB_API_TOKEN env if you want to post the Release Notes of your project.\
    \nAccess https://github.com/settings/tokens/new to create a Personal Token.\
    \nCheck the settings section in README for details.'
          .yellow.bold
      )
    }
  }

  /**
   * Get information in CHANGELOG.md about
   * new version that will be released.
   * @return release notes between versions
   */
  function getReleaseNotes() {
    if (!fs.existsSync(config.changelogPath)) {
      if (!config.quiet)
        console.log(
          'Create a CHANGELOG.md if you want a Release Notes in your Github Project'
            .red.bold
        )
      return
    }
    const data = fs
      .readFileSync(config.changelogPath, err => {
        if (err) throw new Error(`Error reading file: ${err}`)
      })
      .toString()
    if (data.indexOf(config.unreleased) < 0) {
      if (!config.quiet) {
        console.log(
          "I can't post your Release Notes. :(\
        \nMake your CHANGELOG great again and follow the CHANGELOG format http://keepachangelog.com/en/1.0.0/"
            .yellow.bold
        )
      }
      return
    }
    const unreleased =
      data.indexOf(config.unreleased) + config.unreleased.length
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
    return execSync('git remote get-url origin')
      .toString()
      .trim()
      .replace('.git', '')
      .split(':')[1]
      .split('/')
      .slice(-2)
  }

  // No prompt necessary, release and finish.
  if (!opts.cli || opts.silent) {
    return steps.release(config, opts)
  }

  // User wants a confirmation prompt
  prompt.start()
  const property = {
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
    steps.release(config, opts)
  })

  return Promise.resolve()
}
