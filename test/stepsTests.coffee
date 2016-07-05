should = require 'should'
sinon = require 'sinon'
semver = require 'semver'
require 'shelljs/global'

steps = require '../lib/steps.js'

createFile = (filePath, contents) ->
  contents.to filePath

describe 'Steps', ->
  before ->
    cd 'test'

  after ->
    if test '-e', 'package.json' then rm '-f', 'package.json'
    if test '-e', 'src/ProductAssemblyInfo.json' then rm '-f', 'package.json'
    cd '..'

  describe 'picking version provider', ->
    it 'should pick first matching provider', ->
      # arrange
      "".to 'myversion.ext'
      p1 = () -> @name = 'p1'
      p1.supports = (filePath) -> false

      p2 = () -> @name = 'p2'
      p2.supports = (filePath) -> true

      p3 = () -> @name = 'p3'
      p3.supports = (filePath) -> false

      providers = [ p1, p2, p3 ]

      # act
      provider = steps.pickVersionProvider 'myversion.ext', providers

      # assert
      provider.name.should.equal 'p2'
      rm 'myversion.ext'

    it 'should throw error if a provider cannot be found', ->
      # arrange
      "".to 'myversion.bla'
      providers = [
        supports: () -> false
      ,
        supports: () -> false
      ]

      # act & assert
      ( ->
        steps.pickVersionProvider 'myversion.bla', providers
      ).should.throw /^Unable to find a provider that supports/
      rm 'myversion.bla'

    it 'should throw error if file does not exist', ->
      # act & assert
      ( ->
        # Force `manifest.json` to not be found.
        sinon.stub(global, 'test', -> false)
        steps.pickVersionProvider 'mypackage.json'
      ).should.throw /^Version file not found:/
      global.test.restore()


  describe 'setup', ->
    it 'should not promote a stable version', (done) ->
      # arrange
      provider = readVersion: -> semver '1.2.3'

      # act & assert
      ( ->
        steps.setup provider, 'promote', ''
      ).should.throw()
      done()

    it 'should set config', (done) ->
      # arrange
      provider = readVersion: -> semver '1.2.3'

      # act
      config = steps.setup provider, 'patch', ''

      # assert
      config.newVersion.should.equal '1.2.4'
      config.oldVersion.should.equal '1.2.3'
      config.versionProvider.should.equal provider
      done()

    it 'should bump patch', (done) ->
      # arrange
      provider = readVersion: -> semver '1.2.3'

      # act
      config = steps.setup provider, 'patch', ''

      # assert
      config.newVersion.should.equal '1.2.4'
      done()

    it 'should bump minor', (done) ->
      # arrange
      provider = readVersion: -> semver '1.2.3'

      # act
      config = steps.setup provider, 'minor', ''

      # assert
      config.newVersion.should.equal '1.3.0'
      done()

    it 'should bump major', (done) ->
      # arrange
      provider = readVersion: -> semver '1.2.3'

      # act
      config = steps.setup provider, 'major', ''

      # assert
      config.newVersion.should.equal '2.0.0'
      done()

    it 'should bump prerelease', (done) ->
      # arrange
      provider = readVersion: -> semver '1.2.3-beta.4'

      # act
      config = steps.setup provider, 'prerelease', ''

      # assert
      config.newVersion.should.equal '1.2.3-beta.5'
      done()

    it 'should create prerelease', (done) ->
      # arrange
      provider = readVersion: -> semver '1.2.3'

      # act
      config = steps.setup provider, 'patch', 'beta'

      # assert
      config.newVersion.should.equal '1.2.4-beta'
      done()

    it 'should promote prerelease', (done) ->
      # arrange
      provider = readVersion: -> semver '1.2.3-beta.4'

      # act
      config = steps.setup provider, 'promote', ''

      # assert
      config.newVersion.should.equal '1.2.3'
      done()

  describe 'get options file', ->
    it 'should use _releasy.yaml file', (done) ->
      # arrange
      createFile '_releasy.yaml',
        """
        default: major
        """

      # act
      options = steps.getOptionsFile()

      # assert
      rm '_releasy.yaml'
      options.default.should.equal 'major'
      done()

    it 'should use _releasy.yml file', (done) ->
      # arrange
      createFile '_releasy.yml',
        """
        default: major
        """

      # act
      options = steps.getOptionsFile()

      # assert
      rm '_releasy.yml'
      options.default.should.equal 'major'
      done()

    it 'should use _releasy.json file', (done) ->
      # arrange
      createFile '_releasy.json',
        """
        {
          "default": "major"
        }
        """

      # act
      options = steps.getOptionsFile()

      # assert
      rm '_releasy.json'
      options.default.should.equal 'major'
      done()

    it 'should return empty object if no file is found', (done) ->
      # act
      options = steps.getOptionsFile()

      # assert
      options.should.be.empty
      done()
