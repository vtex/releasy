const { existsSync, readFileSync } = require('fs')
const { execSync } = require('child_process')

const chalk = require('chalk')
const prompt = require('prompt')

const Steps = require('./steps')

module.exports = function (opts) {
  // Expose this to unit testing
  const steps = opts.steps || Steps

  const versionProvider = steps.pickVersionProvider(opts.filename)

  const config = steps.setup(
    versionProvider,
    opts.type,
    opts.stable ? 'stable' : opts.tagName
  )

  const quiet = opts.quiet || process.env.NODE_ENV === 'test'

  if (!quiet) {
    console.log(`Current version: ${chalk.bold(config.currentVersion)}`)
    console.log(`New version: ${chalk.yellow.bold(config.newVersion)}`)
  }

  // Pachamama v2 requires that version tags start with a 'v' character.
  config.tagName = `v${config.newVersion}`
  config.currentVersionTagName = `v${config.currentVersion}`

  if (opts.displayName) {
    // TODO: Validade with @reliability if the pachamama accepts this new tag structure.
    config.tagName = `${versionProvider.readName()}@${config.newVersion}`
    config.currentVersionTagName = `${versionProvider.readName()}@${
      config.currentVersion
    }`
  }

  config.commitMessage = `Release ${config.tagName}`
  config.tagMessage = `Release ${config.tagName}`
  config.npmTag = opts.npmTag
  config.npmFolder = opts.npmFolder
  config.dryRun = opts.dryRun
  config.quiet = quiet
  config.unreleasedRaw = 'Unreleased'
  config.unreleased = `## [${config.unreleasedRaw}]`
  config.changelogPath = 'CHANGELOG.md'
  config.githubAuth = getGithubToken()
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

    if (!config.quiet && opts.notes) {
      console.log(
        chalk.yellow.bold(
          `You must set GITHUB_API_TOKEN env if you want to post the Release Notes of your project.
Access https://github.com/settings/tokens/new to create a Personal Token.
Check the settings section in README for details.`
        )
      )
    }
  }

  /**
   * Get information in CHANGELOG.md about
   * new version that will be released.
   * @return release notes between versions
   */
  function getReleaseNotes() {
    if (!opts.notes) {
      return
    }

    if (!existsSync(config.changelogPath)) {
      if (!config.quiet)
        console.log(
          chalk.red.bold(
            'Create a CHANGELOG.md if you want a Release Notes in your Github Project'
          )
        )

      return
    }

    const data = readFileSync(config.changelogPath, (err) => {
      if (err) throw new Error(`Error reading file: ${err}`)
    }).toString()

    if (data.indexOf(config.unreleased) < 0) {
      if (!config.quiet) {
        console.log(
          chalk.yellow.bold(
            `I can't post your Release Notes. :(

You must follow the CHANGELOG conventions defined in http://keepachangelog.com/en/1.0.0/`
          )
        )
      }

      return
    }

    const unreleased =
      data.indexOf(config.unreleased) + config.unreleased.length

    const oldVersion = data.indexOf(config.currentVersion) - 4

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
    description: chalk.green('Are you sure?'),
    default: 'yes',
    required: true,
    before: (value) => {
      return value === 'yes' || value === 'y'
    },
  }

  return new Promise((resolve, reject) => {
    prompt.get(property, (err, result) => {
      if (err || !result.confirm) {
        console.log('\nCancelled by user')

        return
      }

      steps.release(config, opts).then(resolve, reject)
    })
  })
}
