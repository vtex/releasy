should = require 'should'
semver = require 'semver'
require 'shelljs/global'

steps = require '../libs/steps.js'
CsharpVersionProvider = require '../libs/csharpVersionProvider.js'
NodeVersionProvider = require '../libs/nodeVersionProvider.js'

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
    it 'should return C# provider if file has .cs extension', ->
      # act
      "".to 'SomeFile.cs'
      provider = steps.pickVersionProvider 'SomeFile.cs'

      # assert
      provider.should.be.instanceOf CsharpVersionProvider
      provider.filePath.should.equal 'SomeFile.cs'
      rm 'SomeFile.cs'

    it 'should return NodeJS provider if file has .json extension', ->
      # arrange
      "{}".to 'package.json'

      # act
      provider = steps.pickVersionProvider 'package.json'

      # assert
      provider.should.be.instanceOf NodeVersionProvider
      provider.filePath.should.equal 'package.json'

    it 'should return C# provider if package.json has AssemblyInfo field', ->
      # arrange
      JSON.stringify(assemblyInfo: 'MyAssemblyInfo.cs').to 'package.json'

      # act
      provider = steps.pickVersionProvider 'package.json'

      # assert
      provider.should.be.instanceOf CsharpVersionProvider
      provider.filePath.should.equal 'MyAssemblyInfo.cs'
      rm '-f', 'MyAssemblyInfo.cs'

    it 'should return C# provider if package.json does not exist', ->
      # arrange
      if test '-e', 'package.json' then rm '-f', 'package.json'
      mkdir 'src'
      "".to 'src/ProductAssemblyInfo.cs'

      # act
      provider = steps.pickVersionProvider 'package.json'

      # assert
      provider.should.be.instanceOf CsharpVersionProvider
      provider.filePath.should.equal 'src/ProductAssemblyInfo.cs'
      rm '-rf', 'src'

    it 'should throw error if file does not exist', ->
      # act & assert
      ( ->
        steps.pickVersionProvider 'mypackage.json'
      ).should.throw /not found$/


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
