const fs = require('fs')
const { exec, spawn } = require('child_process')
const util = require('util')

const chalk = require('chalk')
const Github = require('github-api')
const yaml = require('js-yaml')
const prompt = require('prompt')

const providers = require('./providers')
const { addChangelogVersionLinks } = require('./changelog')

const execAsync = util.promisify(exec)

const steps = {
  getOptionsFile: () => {
    const possibleFiles = ['_releasy.yaml', '_releasy.yml', '_releasy.json']

    for (let i = 0; i < possibleFiles.length; i++) {
      const name = possibleFiles[i]

      if (fs.existsSync(name)) {
        return yaml.safeLoad(fs.readFileSync(name).toString())
      }
    }

    return {}
  },
  pickVersionProvider: (fileName, overrideProviders) => {
    const currentProviders = overrideProviders || providers

    for (const i in currentProviders) {
      const Provider = currentProviders[i]

      if (Provider.supports(fileName)) {
        return new Provider(fileName)
      }
    }

    throw new Error(
      util.format(
        "Unable to find a provider that supports '%s' as a version file",
        fileName
      )
    )
  },
  setup: (versionProvider, type, prerelease) => {
    let version = versionProvider.readVersion()

    // Support for "promote" predicate, which bumps prerelease to stable, without changing version number.
    if (type === 'promote') {
      // Promote only makes sense when there is a prerelease
      if (version.prerelease.length === 0) {
        throw new Error(
          `The version you are trying to promote to stable (${version.format()}) is already stable.\n`
        )
      } else {
        version.prerelease = []
        prerelease = 'stable'
      }
    }
    // For other types, simply increment
    else {
      const incrementType =
        type === 'prerelease' ||
        prerelease === 'stable' ||
        version.prerelease.length === 0
          ? type || 'patch'
          : `pre${type}` || 'prepatch'

      version = version.inc(incrementType)
    }

    if (prerelease && prerelease !== 'stable' && type !== 'prerelease') {
      version.prerelease = [prerelease]
    }

    return {
      versionProvider,
      newVersion: version.format(),
      currentVersion: versionProvider.readVersion().format(),
    }
  },
  scripts: async (msg, config, key) => {
    const pkg = /package\.json$/.test(config.versionProvider.filePath)
    const manifest = /manifest\.json$/.test(config.versionProvider.filePath)

    if (!(pkg || manifest)) return

    let cmd

    try {
      cmd = config.versionProvider.getScript(key)
    } catch (err) {
      return
    }

    return cmd
      ? steps.spawn(cmd, msg, config.dryRun, config.quiet)
      : Promise.resolve()
  },
  preReleasy: async (config) => {
    const msg = 'Pre releasy'

    const preScriptStatus = await steps.status(config)

    if (!config.dryRun && preScriptStatus.indexOf('nothing to commit') === -1) {
      throw new Error('\nPlease commit your changes before proceeding.')
    }

    await steps.scripts(msg, config, 'prereleasy')
    const postScriptStatus = await steps.status(config)

    if (postScriptStatus.indexOf('nothing to commit') > -1) {
      return
    }

    const cmd = config.versionProvider.getScript('prereleasy')
    const preCfg = {
      commitMessage: `Pre releasy commit\n\n ${cmd}`,
      dryRun: config.dryRun,
      versionProvider: {
        filePath: '.',
      },
      quiet: true,
    }

    await steps.commit(preCfg)
  },
  run: async (cmd, successMessage, dryRun, quiet) => {
    const stdout = await (dryRun
      ? Promise.resolve('')
      : execAsync(cmd).then((result) => result.stdout))

    if (successMessage && !quiet) {
      console.log(chalk`${successMessage} {blue > ${cmd}}`)
    }

    return stdout
  },
  spawn: (cmd, successMessage, dryRun, quiet) => {
    return new Promise((resolve, reject) => {
      if (dryRun) {
        return resolve()
      }

      const childEnv = Object.create(process.env)
      const childIO = quiet ? null : 'inherit'

      let argsW32 = false
      let command
      let env
      let args

      if (/^(?:[A-Z]*_*)*[A-Z]*=/.test(cmd) && !dryRun) {
        env = cmd.split('=')
        childEnv[env[0]] = env[1].split(' ')[0]
      }

      if (process.platform === 'win32') {
        const argsCmd = env ? env[1].substr(env[1].indexOf(' ') + 1) : cmd

        args = ['/s', '/c', argsCmd]
        command = 'cmd.exe'
        argsW32 = true
      } else {
        args = env ? env[1].split(' ').slice(1) : cmd.split(' ')
        command = args.shift()
      }

      const childProcess = spawn(command, args, {
        env: childEnv,
        stdio: childIO,
        windowsVerbatimArguments: argsW32,
      })

      childProcess.on('close', (code) => {
        if (code === 0) {
          return resolve()
        }

        reject(`\nCommand exited with error code: ${code}`)
      })
    }).then(() => {
      if (!quiet) {
        console.log(chalk`${successMessage} {blue > ${cmd}}`)
      }
    })
  },
  status: (config) => {
    return steps.run('git status', '', false, config.quiet)
  },
  bump: (config) => {
    // Update version on CHANGELOG.md
    if (fs.existsSync(config.changelogPath)) {
      const changelogContent = fs
        .readFileSync(config.changelogPath, (err) => {
          if (err) throw new Error(`Error reading file: ${err}`)
        })
        .toString()

      if (changelogContent.indexOf(config.unreleased) < 0) {
        console.error(
          chalk.red.bold(
            `Cannot update your CHANGELOG file.

You must follow the CHANGELOG conventions defined in http://keepachangelog.com/en/1.0.0/`
          )
        )
      } else {
        let updatedChangelog = changelogContent

        const [year, month, day] = new Date()
          .toISOString()
          .split('T')[0]
          .split('-')

        const changelogVersion = `\n\n## [${config.newVersion}] - ${year}-${month}-${day}`

        const startIndex =
          updatedChangelog.indexOf(config.unreleased) + config.unreleased.length

        updatedChangelog = `${updatedChangelog.slice(
          0,
          startIndex
        )}${changelogVersion}${updatedChangelog.substring(startIndex)}`

        updatedChangelog = addChangelogVersionLinks(config, updatedChangelog)

        if (!config.dryRun) {
          fs.writeFileSync(config.changelogPath, updatedChangelog)
        }
      }
    }

    const promise = config.dryRun
      ? Promise.resolve()
      : Promise.resolve(config.versionProvider.writeVersion(config.newVersion))

    return promise.then((result) => {
      if (!config.quiet)
        console.log(`Version bumped to ${chalk.green.bold(config.newVersion)}`)

      return result
    })
  },
  add: (config) => {
    let gitAddCommand = `git add ${config.versionProvider.filePath.join(' ')}`
    let successMessage = `File(s) ${config.versionProvider.filePath} added`

    if (fs.existsSync(config.changelogPath)) {
      gitAddCommand += ` ${config.changelogPath}`
      successMessage = `Files ${config.versionProvider.filePath} ${config.changelogPath} added`
    }

    return steps.run(gitAddCommand, successMessage, config.dryRun, config.quiet)
  },
  commit: (config) => {
    let successMessage = `File(s) ${config.versionProvider.filePath} commited`

    if (fs.existsSync(config.changelogPath)) {
      successMessage = `Files ${config.versionProvider.filePath} ${config.changelogPath} commited`
    }

    return steps.run(
      `git commit -m "${config.commitMessage}"`,
      successMessage,
      config.dryRun,
      config.quiet
    )
  },
  tag: (config) => {
    return steps.run(
      `git tag ${config.tagName} -m "${config.tagMessage}"`,
      `Tag created: ${config.tagName}`,
      config.dryRun,
      config.quiet
    )
  },
  push: (config) => {
    return steps.run(
      'git push --follow-tags',
      'Pushed commit and tags',
      config.dryRun,
      config.quiet
    )
  },
  releaseNotes: (config) => {
    // Post Release Notes at the Github
    const { changelogPath, githubAuth, githubInfo, release, dryRun } = config

    if (!fs.existsSync(changelogPath) || !githubAuth || dryRun) {
      console.log(
        chalk.yellow("You don't have a CHANGELOG to post Release Notes")
      )

      return Promise.resolve()
    }

    const client = new Github({ token: githubAuth })

    return client
      .getRepo(githubInfo[0], githubInfo[1])
      .createRelease(release)
      .then(() => {
        if (!config.quiet) console.log(chalk.green('Release Notes submitted'))
      })
      .catch((err) => {
        throw new Error(`Error on request ${err}`)
      })
  },
  postReleasy: (config) => {
    const msg = 'Post releasy'

    return steps.scripts(msg, config, 'postreleasy')
  },
  publish: async (config, { otp = '', otpMessage = '', otpRetries = 0 }) => {
    let cmd = 'npm publish'
    let msg = `Published ${config.newVersion} to npm`

    if (config.npmTag) {
      cmd += ` --tag ${config.npmTag}`
      msg += `with a tag of "${config.npmTag}"`
    }

    if (otp) {
      cmd += ` --otp ${otp}`
    }

    if (config.npmFolder) {
      cmd += ` ${config.npmFolder}`
    }

    try {
      return await steps.run(cmd, msg, config.dryRun, config.quiet)
    } catch (error) {
      const isOTPError = error.message.includes('code EOTP')

      if (isOTPError && otpRetries > 0) {
        if (otpMessage) {
          console.log(otpMessage)
        }

        return new Promise((resolve, reject) => {
          // User has enabled two-factor authentication to
          // publish NPM packages, so prompt user for it and retry publishing
          prompt.start()
          prompt.get(
            {
              name: 'otp',
              type: 'string',
              description: 'npm one-time password',
              default: '',
              required: true,
            },
            (err, result) => {
              if (err || !result.otp) {
                reject('Cancelled by user')

                return
              }

              steps
                .publish(config, {
                  otp: result.otp,
                  otpMessage: 'Incorrect or expired OTP',
                  otpRetries: otpRetries - 1,
                })
                .then(resolve, reject)
            }
          )
        })
      }

      if (isOTPError) {
        throw new Error(
          'OTP code is incorrect or expired and you have runned out of attemps'
        )
      }

      throw error
    }
  },
  release: async (config, options) => {
    try {
      if (!config.quiet) console.log('Starting release...')

      await steps.preReleasy(config)
      await steps.bump(config)

      if (options.commit) {
        await steps.add(config)
        await steps.commit(config)
      }

      if (options.tag) {
        await steps.tag(config)
      }

      if (options.push) {
        await steps.push(config)
      }

      if (options.notes) {
        await steps.releaseNotes(config)
      }

      if (options.npm) {
        await steps.publish(config, {
          otp: options.otp,
          // In case the otp code was passed via options, we won't
          // retry as this is likely a script which won't know how
          // to respond to our prompt in case the publish fails
          otpRetries: options.otp ? 0 : 3,
        })
      }

      await steps.postReleasy(config)

      if (!config.quiet) {
        console.log(chalk.green('All steps finished successfully.'))
      }
    } catch (reason) {
      if (!config.quiet) {
        console.error(
          chalk.red.bold('[ERROR] Failed to release.\n'),
          reason instanceof Error ? reason.message : reason
        )
      }
    }
  },
}

module.exports = steps
