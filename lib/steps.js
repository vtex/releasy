var { cat } = require('shelljs')
var Q = require('q')
var util = require('util')
var exec = require('child_process').exec
var spawn = require('child_process').spawn
var fs = require('fs')
var yaml = require('js-yaml')
var providers = require('./providers.js')
var Github = require('github-api')

var steps = {
  getOptionsFile: () => {
    const possibleFiles = ['_releasy.yaml', '_releasy.yml', '_releasy.json']
    for (let i = 0; i < possibleFiles.length; i++) {
      const name = possibleFiles[i]
      if (test('-e', name)) { return yaml.safeLoad(cat(name)) }
    }
    return {}
  },
  pickVersionProvider: (fileName, overrideProviders) => {
    const currentProviders = overrideProviders || providers
    for (const i in currentProviders) {
      const provider = currentProviders[i]
      if (provider.supports(fileName)) {
        return new provider(fileName)
      }
    }
    throw new Error(util.format("Unable to find a provider that supports '%s' as a version file", fileName))
  },
  setup: (versionProvider, type, prerelease) => {
    let version = versionProvider.readVersion()
    // Support for "promote" predicate, which bumps prerelease to stable, without changing version number.
    if (type === 'promote') {
      // Promote only makes sense when there is a prerelease
      if (version.prerelease.length === 0) {
        throw new Error(`The version you are trying to promote to stable (${version.format()}) is already stable.\n`)
      } else {
        version.prerelease = []
        prerelease = 'stable'
      }
    }
    // For other types, simply increment
    else {
      const incrementType = type === 'prerelease' ||
        prerelease === 'stable' ||
        version.prerelease.length === 0
        ? type || 'patch'
        : (`pre${type}`) || 'prepatch'
      version = version.inc(incrementType)
    }
    if (prerelease && prerelease !== 'stable' && type !== 'prerelease') {
      version.prerelease = [prerelease]
    }
    return {
      versionProvider: versionProvider,
      newVersion: version.format(),
      oldVersion: versionProvider.readVersion().format(),
    }
  },
  scripts: (msg, config, key) => {
    const pkg = /package\.json$/.test(config.versionProvider.filePath)
    const manifest = /manifest\.json$/.test(config.versionProvider.filePath)
    if (!(pkg || manifest)) return Q()
    try {
      var cmd = config.versionProvider.getScript(key)
    } catch (err) {
      return Q()
    }
    return cmd
      ? steps.spawn(cmd, msg, config.dryRun, config.quiet)
      : Q()
  },
  preReleasy: config => {
    const msg = 'Pre releasy'
    return steps.status(config)
      .then(stdout => {
        if (!config.dryRun && stdout[0].indexOf('nothing to commit') === -1) {
          throw '\nPlease commit your changes before proceeding.'
        } else {
          return Q()
        }
      })
      .then(() => { return steps.scripts(msg, config, 'prereleasy') })
      .then(() => { return steps.status(config) })
      .then(stdout => {
        if (stdout[0].indexOf('nothing to commit') > -1) return Q()
        const cmd = config.versionProvider.getScript('prereleasy')
        const preCfg = {
          commitMessage: `Pre releasy commit\n\n ${cmd}`,
          dryRun: config.dryRun,
          versionProvider: {
            filePath: '.',
          },
          quiet: true,
        }
        return steps.commit(preCfg)
      })
  },
  run: (cmd, successMessage, dryRun, quiet) => {
    const promise = dryRun ? Q() : Q.nfcall(exec, cmd)
    if (successMessage) {
      promise.then(stdout => {
        if (!quiet) console.log(successMessage + ' > '.blue + cmd.blue)
        return stdout
      })
    }
    return promise
  },
  spawn: (cmd, successMessage, dryRun, quiet) => {
    const deferred = Q.defer()
    deferred.promise.then(() => {
      if (!quiet) console.log(successMessage + ' > '.blue + cmd.blue)
    })
    if (dryRun) {
      deferred.resolve()
      return deferred.promise
    }
    const childEnv = Object.create(process.env)
    const childIO = quiet ? null : 'inherit'
    let argsW32 = false
    if (/^(?:[A-Z]*_*)*[A-Z]*=/.test(cmd) && !dryRun) {
      var env = cmd.split('=')
      childEnv[env[0]] = env[1].split(' ')[0]
    }
    if (process.platform === 'win32') {
      const argsCmd = env ? env[1].substr(env[1].indexOf(' ') + 1) : cmd
      var args = ['/s', '/c', argsCmd]
      var command = 'cmd.exe'
      argsW32 = true
    } else {
      var args = env ? env[1].split(' ').slice(1) : cmd.split(' ')
      var command = args.shift()
    }
    const childProcess = spawn(command, args, { env: childEnv, stdio: childIO, windowsVerbatimArguments: argsW32 })
    childProcess.on('close', code => {
      if (code === 0) deferred.resolve()
      else deferred.reject(`\nCommand exited with error code: ${code}`)
    })
    return deferred.promise
  },
  status: config => {
    return steps.run('git status', '', false, config.quiet).then(stdout => {
      return stdout
    })
  },
  bump: config => {
    // Update version on CHANGELOG.md
    if (fs.existsSync(config.changelogPath)) {
      const data = fs.readFileSync(config.changelogPath, err => {
        if (err)throw `Error reading file: ${err}`
      }).toString()
      if (data.indexOf(config.unreleased) < 0 && !config.quiet) {
        console.log("I can't update your CHANGELOG. :( \
                  \nMake your CHANGELOG great again and follow the CHANGELOG format http://keepachangelog.com/en/1.0.0/".red.bold)
      } else {
        const position = data.indexOf(config.unreleased) + config.unreleased.length
        const bufferedText = Buffer.from(`${config.changelogVersion}${data.substring(position)}`)
        const file = fs.openSync(config.changelogPath, 'r+')
        fs.writeSync(file, bufferedText, 0, bufferedText.length, position, err => {
          if (err)throw `Error writing file: ${err}`
          fs.close(file)
        })
      }
    }

    const promise = config.dryRun ? Q() : Q(config.versionProvider.writeVersion(config.newVersion))
    return promise.then(result => {
      if (!config.quiet) console.log(`Version bumped to ${config.newVersion.bold.green}`)
      return result
    })
  },
  add: config => {
    let gitAddCommand = `git add ${config.versionProvider.filePath}`
    let successMessage = `File ${config.versionProvider.filePath} added`
    if (fs.existsSync(config.changelogPath)) {
      gitAddCommand = `git add ${config.versionProvider.filePath} ${config.changelogPath}`
      successMessage = `Files ${config.versionProvider.filePath} ${config.changelogPath} added`
    }
    return steps.run(gitAddCommand, successMessage, config.dryRun, config.quiet)
  },
  commit: config => {
    let successMessage = `File ${config.versionProvider.filePath} commited`
    if (fs.existsSync(config.changelogPath)) {
      successMessage =
        `Files ${config.versionProvider.filePath} ${config.changelogPath} commited`
    }
    return steps.run(`git commit -m "${config.commitMessage}"`, successMessage,
      config.dryRun, config.quiet)
  },
  tag: config => {
    return steps.run(`git tag ${config.tagName} -m "${config.tagMessage}"`,
      `Tag created: ${config.tagName}`, config.dryRun, config.quiet)
  },
  push: config => {
    return steps.run(`git push && git push origin ${config.tagName}`,
      'Pushed commit and tags', config.dryRun, config.quiet)
  },
  releaseNotes: config => {
    // Post Release Notes at the Github
    const { changelogPath, githubAuth, githubInfo, release } = config
    if (fs.existsSync(changelogPath) && githubAuth) {
      const client = new Github({ token: githubAuth })
      client.getRepo(githubInfo[0], githubInfo[1])
        .createRelease(release)
        .then(() => {
          if (!config.quiet) console.log('Release Notes submitted'.green)
        })
        .catch(err => {
          throw `Error on request ${err}`
        })
    } else {
      console.log('You don\'t have a CHANGELOG to post Release Notes'.yellow)
    }
  },
  postReleasy: config => {
    const msg = 'Post releasy'
    return steps.scripts(msg, config, 'postreleasy')
  },
  publish: config => {
    let cmd = 'npm publish'
    let msg = `Published ${config.newVersion} to npm`
    if (config.npmTag) {
      cmd += ` --tag ${config.npmTag}`
      msg += `with a tag of "${config.npmTag}"`
    }
    if (config.npmFolder) {
      cmd += ` ${config.npmFolder}`
    }
    return steps.run(cmd, msg, config.dryRun, config.quiet)
  },
  release: (config, options) => {
    if (!config.quiet) console.log('Starting release...')
    let promise = steps.preReleasy(config)
    promise.then(() => {
      return steps.bump(config)
    })
    if (options.commit) {
      promise = promise.then(() => {
        return steps.add(config)
      })
      promise = promise.then(() => {
        return steps.commit(config)
      })
    }
    if (options.tag) {
      promise = promise.then(() => {
        return steps.tag(config)
      })
    }
    if (options.push) {
      promise = promise.then(() => {
        return steps.push(config)
      })
    }
    if (options.notes) {
      promise = promise.then(() => {
        return steps.releaseNotes(config)
      })
    }
    if (options.npm) {
      promise = promise.then(() => {
        return steps.publish(config)
      })
    }
    promise = promise
      .then(() => {
        return steps.postReleasy(config)
      })
      .then(() => {
        if (!config.quiet) console.log('All steps finished successfully.'.green)
      })
    promise.fail(reason => {
      if (!config.quiet) console.error('[ERROR] Failed to release.\n'.red.bold, reason)
    })
    return promise
  },
}

module.exports = steps
