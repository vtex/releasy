const semver = require('semver')
const { rm, cd, test: execTest } = require('shelljs')

const steps = require('../lib/steps.js')
const writeToFile = require('../lib/includes/writeToFile')

describe('Steps', () => {
  beforeEach(() => cd('test'))

  afterEach(() => {
    if (execTest('-e', 'package.json')) rm('-f', 'package.json')
    if (execTest('-e', 'src/ProductAssemblyInfo.json')) rm('-f', 'package.json')
    cd('..')
  })

  describe('picking version provider', () => {
    it('should pick first matching provider', () => {
      // arrange

      writeToFile('myversion.ext', '')
      const p1 = function Provider1() {
        this.name = 'p1'
      }

      p1.supports = () => false

      const p2 = function Provider2() {
        this.name = 'p2'
      }

      p2.supports = () => true

      const p3 = function Provider3() {
        this.name = 'p3'
      }

      p3.supports = () => false

      const providers = [p1, p2, p3]

      // act
      const provider = steps.pickVersionProvider('myversion.ext', providers)

      // assert
      expect(provider.name).toBe('p2')
      rm('myversion.ext')
    })

    it('should throw error if a provider cannot be found', () => {
      // arrange
      writeToFile('myversion.bla', '')
      const providers = [{ supports: () => false }, { supports: () => false }]

      // act & assert
      expect(() =>
        steps.pickVersionProvider('myversion.bla', providers)
      ).toThrow(/^Unable to find a provider that supports/)

      rm('myversion.bla')
    })

    it('should throw error if file does not exist', () => {
      // act & assert
      expect(
        // Force `manifest.json` to not be found.
        () => steps.pickVersionProvider('somedir/somejsonfile.json')
      ).toThrow(/^Version file not found:/)
    })
  })

  describe('setup', () => {
    it('should not promote a stable version', () => {
      // arrange
      const provider = {
        readVersion() {
          return semver('1.2.3')
        },
      }

      // act & assert
      expect(() => steps.setup(provider, 'promote', '')).toThrow()
    })

    it('should set config', () => {
      // arrange
      const provider = {
        readVersion() {
          return semver('1.2.3')
        },
      }

      // act
      const config = steps.setup(provider, 'patch', '')

      // assert
      expect(config.newVersion).toBe('1.2.4')
      expect(config.oldVersion).toBe('1.2.3')
      expect(config.versionProvider).toBe(provider)
    })

    it('should bump patch', () => {
      // arrange
      const provider = {
        readVersion() {
          return semver('1.2.3')
        },
      }

      // act
      const config = steps.setup(provider, 'patch', '')

      // assert
      expect(config.newVersion).toBe('1.2.4')
    })

    it('should bump minor', () => {
      // arrange
      const provider = {
        readVersion() {
          return semver('1.2.3')
        },
      }

      // act
      const config = steps.setup(provider, 'minor', '')

      // assert
      expect(config.newVersion).toBe('1.3.0')
    })

    it('should bump major', () => {
      // arrange
      const provider = {
        readVersion() {
          return semver('1.2.3')
        },
      }

      // act
      const config = steps.setup(provider, 'major', '')

      // assert
      expect(config.newVersion).toBe('2.0.0')
    })

    it('should bump prerelease', () => {
      // arrange
      const provider = {
        readVersion() {
          return semver('1.2.3-beta.4')
        },
      }

      // act
      const config = steps.setup(provider, 'prerelease', '')

      // assert
      expect(config.newVersion).toBe('1.2.3-beta.5')
    })

    it('should create prerelease', () => {
      // arrange
      const provider = {
        readVersion() {
          return semver('1.2.3')
        },
      }

      // act
      const config = steps.setup(provider, 'patch', 'beta')

      // assert
      expect(config.newVersion).toBe('1.2.4-beta')
    })

    it('should promote prerelease', () => {
      // arrange
      const provider = {
        readVersion() {
          return semver('1.2.3-beta.4')
        },
      }

      // act
      const config = steps.setup(provider, 'promote', '')

      // assert
      expect(config.newVersion).toBe('1.2.3')
    })
  })

  describe('get options file', () => {
    it('should use _releasy.yaml file', () => {
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
      expect(options.default).toBe('major')
    })

    it('should use _releasy.yml file', () => {
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
      expect(options.default).toBe('major')
    })

    it('should use _releasy.json file', () => {
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
      expect(options.default).toBe('major')
    })

    it('should return empty object if no file is found', () => {
      // act
      const options = steps.getOptionsFile()

      // assert
      expect(options).toEqual({})
    })
  })
})
