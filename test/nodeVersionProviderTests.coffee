path = require 'path'
should = require 'should'
require 'shelljs/global'
semver = require 'semver'

NodeVersionProvider = require '../libs/nodeVersionProvider.js'

createPackageJson = (filePath, pkg) ->
  JSON.stringify(pkg).to(path.resolve("./#{filePath}"))

describe 'NodeVersionProvider', ->
  after ->
    rm('-rf', path.resolve("test/package.json"))

  describe 'reading node version', ->
    it 'should return SemVer object', (done) ->
      # arrange
      createPackageJson 'test/package.json', version: '1.2.3-beta.4'
      provider = new NodeVersionProvider 'test/package.json'

      # act
      version = provider.readVersion()

      # assert
      version.format().should.equal('1.2.3-beta.4')
      done()

    it 'should throw error for version in incorrect format', (done) ->
      # arrange
      createPackageJson 'test/package.json', version: 'blabla'
      provider = new NodeVersionProvider 'test/package.json'

      # act & assert
      ( -> 
        version = provider.readVersion()
      ).should.throw()
      done()

  describe 'writing node version', ->
    it 'should accept SemVer object', (done) ->
      # arrange
      createPackageJson 'test/package.json', version: '0.1.0'
      provider = new NodeVersionProvider 'test/package.json'
      newVersion = semver '0.2.0'

      # act
      provider.writeVersion newVersion

      # assert
      JSON.parse(cat 'test/package.json').version.should.equal '0.2.0'
      done()

    it 'should accept string version', (done) ->
      #arrange
      createPackageJson 'test/package.json', version: '0.1.0'
      provider = new NodeVersionProvider 'test/package.json'

      # act
      provider.writeVersion '0.3.0'

      # assert
      JSON.parse(cat 'test/package.json').version.should.equal '0.3.0'
      done()
