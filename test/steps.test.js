const should = require('should')
const semver = require('semver')
const { rm, cd, test } = require('shelljs')

const steps = require('../lib/steps.js')
const writeToFile = require('../lib/includes/writeToFile')

describe('Steps', function() {
  before(() => cd('test'))

  after(function() {
    if (test('-e', 'package.json')) rm('-f', 'package.json')
    if (test('-e', 'src/ProductAssemblyInfo.json')) rm('-f', 'package.json')
    cd('..')
  })

  describe('picking version provider', function() {
    it('should pick first matching provider', function() {
      // arrange

      writeToFile('myversion.ext', '')
      const p1 = function() {
        return (this.name = 'p1')
      }
      p1.supports = () => false

      const p2 = function() {
        return (this.name = 'p2')
      }
      p2.supports = () => true

      const p3 = function() {
        return (this.name = 'p3')
      }
      p3.supports = () => false

      const providers = [p1, p2, p3]

      // act
      const provider = steps.pickVersionProvider('myversion.ext', providers)

      // assert
      should(provider.name).equal('p2')
      return rm('myversion.ext')
    })

    it('should throw error if a provider cannot be found', function() {
      // arrange
      writeToFile('myversion.bla', '')
      const providers = [{ supports: () => false }, { supports: () => false }]

      // act & assert
      ;(() =>
        steps.pickVersionProvider('myversion.bla', providers)).should.throw(
        /^Unable to find a provider that supports/
      )
      return rm('myversion.bla')
    })

    it('should throw error if file does not exist', function() {
      // act & assert
      ;(function() {
        // Force `manifest.json` to not be found.
        return steps.pickVersionProvider('somedir/somejsonfile.json')
      }.should.throw(/^Version file not found:/))
    })
  })

  describe('setup', function() {
    it('should not promote a stable version', function(done) {
      // arrange
      const provider = {
        readVersion() {
          return semver('1.2.3')
        },
      }

      // act & assert
      should(() => steps.setup(provider, 'promote', '')).throw()
      return done()
    })

    it('should set config', function(done) {
      // arrange
      const provider = {
        readVersion() {
          return semver('1.2.3')
        },
      }

      // act
      const config = steps.setup(provider, 'patch', '')

      // assert
      should(config.newVersion).equal('1.2.4')
      should(config.oldVersion).equal('1.2.3')
      should(config.versionProvider).equal(provider)
      return done()
    })

    it('should bump patch', function(done) {
      // arrange
      const provider = {
        readVersion() {
          return semver('1.2.3')
        },
      }

      // act
      const config = steps.setup(provider, 'patch', '')

      // assert
      should(config.newVersion).equal('1.2.4')
      return done()
    })

    it('should bump minor', function(done) {
      // arrange
      const provider = {
        readVersion() {
          return semver('1.2.3')
        },
      }

      // act
      const config = steps.setup(provider, 'minor', '')

      // assert
      should(config.newVersion).equal('1.3.0')
      return done()
    })

    it('should bump major', function(done) {
      // arrange
      const provider = {
        readVersion() {
          return semver('1.2.3')
        },
      }

      // act
      const config = steps.setup(provider, 'major', '')

      // assert
      should(config.newVersion).equal('2.0.0')
      return done()
    })

    it('should bump prerelease', function(done) {
      // arrange
      const provider = {
        readVersion() {
          return semver('1.2.3-beta.4')
        },
      }

      // act
      const config = steps.setup(provider, 'prerelease', '')

      // assert
      should(config.newVersion).equal('1.2.3-beta.5')
      return done()
    })

    it('should create prerelease', function(done) {
      // arrange
      const provider = {
        readVersion() {
          return semver('1.2.3')
        },
      }

      // act
      const config = steps.setup(provider, 'patch', 'beta')

      // assert
      should(config.newVersion).equal('1.2.4-beta')
      return done()
    })

    return it('should promote prerelease', function(done) {
      // arrange
      const provider = {
        readVersion() {
          return semver('1.2.3-beta.4')
        },
      }

      // act
      const config = steps.setup(provider, 'promote', '')

      // assert
      should(config.newVersion).equal('1.2.3')
      return done()
    })
  })

  return describe('get options file', function() {
    it('should use _releasy.yaml file', function(done) {
      // arrange
      writeToFile(
        '_releasy.yaml',
        `\
default: major\
`
      )

      // act
      const options = steps.getOptionsFile()

      // assert
      rm('_releasy.yaml')
      should(options.default).equal('major')
      return done()
    })

    it('should use _releasy.yml file', function(done) {
      // arrange
      writeToFile(
        '_releasy.yml',
        `\
default: major\
`
      )

      // act
      const options = steps.getOptionsFile()

      // assert
      rm('_releasy.yml')
      should(options.default).equal('major')
      return done()
    })

    it('should use _releasy.json file', function(done) {
      // arrange
      writeToFile(
        '_releasy.json',
        `\
{
  "default": "major"
}\
`
      )

      // act
      const options = steps.getOptionsFile()

      // assert
      rm('_releasy.json')
      should(options.default).equal('major')
      return done()
    })

    return it('should return empty object if no file is found', function(done) {
      // act
      const options = steps.getOptionsFile()

      // assert
      should(options).be.empty()
      return done()
    })
  })
})
