const path = require('path')
const { rm, cat } = require('shelljs')
const semver = require('semver')
const should = require('should')

const NodeVersionProvider = require('../lib/providers/node.js')
const writeToFile = require('../lib/includes/writeToFile.js')

const createPackageJson = (filePath, pkg) =>
  writeToFile(path.resolve(`./${filePath}`), JSON.stringify(pkg))

describe('NodeVersionProvider', function() {
  after(() => rm('-rf', path.resolve('test/fixtures/package.json')))

  describe('reading node version', function() {
    it('should return SemVer object', function(done) {
      // arrange
      createPackageJson('test/fixtures/package.json', {
        version: '1.2.3-beta.4',
      })
      const provider = new NodeVersionProvider('test/fixtures/package.json')

      // act
      const version = provider.readVersion()

      // assert
      should(version.format()).equal('1.2.3-beta.4')
      return done()
    })

    return it('should throw error for version in incorrect format', function(done) {
      // arrange
      createPackageJson('test/fixtures/package.json', { version: 'blabla' })
      const provider = new NodeVersionProvider('test/fixtures/package.json')

      // act & assert
      ;(function() {
        return provider.readVersion()
      }.should.throw())
      return done()
    })
  })

  describe('writing node version', function() {
    it('should accept SemVer object', function(done) {
      // arrange
      createPackageJson('test/fixtures/package.json', { version: '0.1.0' })
      const provider = new NodeVersionProvider('test/fixtures/package.json')
      const newVersion = semver('0.2.0')

      // act
      provider.writeVersion(newVersion)

      // assert
      should(JSON.parse(cat('test/fixtures/package.json')).version).equal(
        '0.2.0'
      )
      return done()
    })

    return it('should accept string version', function(done) {
      //arrange
      createPackageJson('test/fixtures/package.json', { version: '0.1.0' })
      const provider = new NodeVersionProvider('test/fixtures/package.json')

      // act
      provider.writeVersion('0.3.0')

      // assert
      should(JSON.parse(cat('test/fixtures/package.json')).version).equal(
        '0.3.0'
      )
      return done()
    })
  })

  return describe('file support', function() {
    it('should support .json extensions', function() {
      // act
      const supports = NodeVersionProvider.supports('mypackage.json')

      // assert
      return should(supports).be.true()
    })

    return it('should not support any other extension', function() {
      // act
      const supports = NodeVersionProvider.supports('arbitrary.extension')

      // assert
      return should(supports).be.false()
    })
  })
})
