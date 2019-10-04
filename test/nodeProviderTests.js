const path = require('path')
const { rm, cat } = require('shelljs')
const semver = require('semver')

const NodeVersionProvider = require('../lib/providers/node.js')

const createPackageJson = (filePath, pkg) =>
  JSON.stringify(pkg).to(path.resolve(`./${filePath}`))

describe('NodeVersionProvider', function() {
  after(() => rm('-rf', path.resolve('test/package.json')))

  describe('reading node version', function() {
    it('should return SemVer object', function(done) {
      // arrange
      createPackageJson('test/package.json', { version: '1.2.3-beta.4' })
      const provider = new NodeVersionProvider('test/package.json')

      // act
      const version = provider.readVersion()

      // assert
      version.format().should.equal('1.2.3-beta.4')
      return done()
    })

    return it('should throw error for version in incorrect format', function(done) {
      // arrange
      createPackageJson('test/package.json', { version: 'blabla' })
      const provider = new NodeVersionProvider('test/package.json')

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
      createPackageJson('test/package.json', { version: '0.1.0' })
      const provider = new NodeVersionProvider('test/package.json')
      const newVersion = semver('0.2.0')

      // act
      provider.writeVersion(newVersion)

      // assert
      JSON.parse(cat('test/package.json')).version.should.equal('0.2.0')
      return done()
    })

    return it('should accept string version', function(done) {
      //arrange
      createPackageJson('test/package.json', { version: '0.1.0' })
      const provider = new NodeVersionProvider('test/package.json')

      // act
      provider.writeVersion('0.3.0')

      // assert
      JSON.parse(cat('test/package.json')).version.should.equal('0.3.0')
      return done()
    })
  })

  return describe('file support', function() {
    it('should support .json extensions', function() {
      // act
      const supports = NodeVersionProvider.supports('mypackage.json')

      // assert
      return supports.should.be.true
    })

    return it('should not support any other extension', function() {
      // act
      const supports = NodeVersionProvider.supports('arbitrary.extension')

      // assert
      return supports.should.be.false
    })
  })
})
