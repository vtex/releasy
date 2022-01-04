const path = require('path')
const fs = require('fs')

const semver = require('semver')

const { createPackageJson } = require('./utils.js')
const NodeVersionProvider = require('../lib/providers/node.js')

const CUSTOM_MANIFEST_PATH = 'test/fixtures/manifest.json'

describe('NodeVersionProvider', () => {
  afterEach(() => {
    if (fs.existsSync('test/fixtures/package.json'))
      fs.unlinkSync(path.resolve('test/fixtures/package.json'))

    if (fs.existsSync(CUSTOM_MANIFEST_PATH))
      fs.unlinkSync(path.resolve(CUSTOM_MANIFEST_PATH))
  })

  describe('reading node version', () => {
    it('should return SemVer object', () => {
      // arrange
      createPackageJson('test/fixtures/package.json', {
        version: '1.2.3-beta.4',
      })
      const provider = new NodeVersionProvider('test/fixtures/package.json')

      // act
      const version = provider.readVersion()

      // assert
      expect(version.format()).toBe('1.2.3-beta.4')
    })

    it('should throw error for version in incorrect format', () => {
      // arrange
      createPackageJson('test/fixtures/package.json', { version: 'blabla' })
      const provider = new NodeVersionProvider('test/fixtures/package.json')

      // act & assert
      expect(() => provider.readVersion()).toThrow()
    })
  })

  describe('writing node version', () => {
    it('should accept SemVer object', () => {
      // arrange
      createPackageJson('test/fixtures/package.json', { version: '0.1.0' })
      const provider = new NodeVersionProvider('test/fixtures/package.json')
      const newVersion = semver('0.2.0')

      // act
      provider.writeVersion(newVersion)

      // assert
      expect(
        JSON.parse(fs.readFileSync('test/fixtures/package.json')).version
      ).toBe('0.2.0')
    })

    it('should accept string version', () => {
      // arrange
      createPackageJson('test/fixtures/package.json', { version: '0.1.0' })
      const provider = new NodeVersionProvider('test/fixtures/package.json')

      // act
      provider.writeVersion('0.3.0')

      // assert
      expect(
        JSON.parse(fs.readFileSync('test/fixtures/package.json')).version
      ).toBe('0.3.0')
    })
  })

  describe('file support', () => {
    it('should support .json extensions', () => {
      // act
      const supports = NodeVersionProvider.supports('mypackage.json')

      // assert
      expect(supports).toBe(true)
    })

    it('should not support any other extension', () => {
      // act
      const supports = NodeVersionProvider.supports('arbitrary.extension')

      // assert
      expect(supports).toBe(false)
    })
  })

  describe('reading node name', () => {
    it('should return name without vendor', () => {
      const name = 'TestName'

      // arrange
      createPackageJson(CUSTOM_MANIFEST_PATH, {
        name,
        version: '1.2.3-beta.4',
      })
      const provider = new NodeVersionProvider(CUSTOM_MANIFEST_PATH)

      // act
      const resultName = provider.readName()

      // assert
      expect(resultName).toBe(name)
    })

    it('should return name with vendor', () => {
      const name = 'TestName'
      const vendor = 'test'
      const filePath = 'test/fixtures/manifest.json'

      // arrange
      createPackageJson(filePath, {
        vendor,
        name,
        version: '1.2.3-beta.4',
      })
      const provider = new NodeVersionProvider(filePath)

      // act
      const resultName = provider.readName()

      // assert
      expect(resultName).toBe(`${vendor}.${name}`)
    })

    it('should throw error name', () => {
      // arrange
      createPackageJson('test/fixtures/package.json', {
        version: '1.2.3-beta.4',
      })
      const provider = new NodeVersionProvider('test/fixtures/package.json')

      // act & assert
      expect(() => provider.readName()).toThrow()
    })
  })
})
