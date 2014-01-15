should = require 'should'
require 'shelljs/global'

steps = require '../libs/steps.js'
CsharpVersionProvider = require '../libs/csharpVersionProvider.js'
NodeVersionProvider = require '../libs/nodeVersionProvider.js'

createFile = (filePath, contents) ->
  contents.to filePath

describe 'Steps', ->
  describe 'picking version provider', ->
    it 'should return C# provider if file has .cs extension', ->
      # act
      provider = steps.pickVersionProvider 'SomeFile.cs'

      # assert
      provider.should.be.instanceOf CsharpVersionProvider
      provider.filePath.should.equal 'SomeFile.cs'

    it 'should return NodeJS provider if file has .json extension', ->
      # arrange
      "{}".to 'test/package.json'

      # act
      provider = steps.pickVersionProvider 'test/package.json'

      # assert
      provider.should.be.instanceOf NodeVersionProvider
      provider.filePath.should.equal 'test/package.json'
      rm '-f', 'test/package.json'

    it 'should return C# provider if package.json has AssemblyInfo field', ->
      # arrange
      JSON.stringify(assemblyInfo: 'MyAssemblyInfo.cs').to 'test/package.json'

      # act
      provider = steps.pickVersionProvider 'test/package.json'

      # assert
      provider.should.be.instanceOf CsharpVersionProvider
      provider.filePath.should.equal 'MyAssemblyInfo.cs'

  describe 'setup from stable version', ->
    before ->
      JSON.stringify(version: '1.2.3').to 'test/package.json'

    after ->
      rm 'test/package.json'

    it 'should not promote', (done) ->
      ( ->
        steps.setup 'test/package.json', 'promote', ''
      ).should.throw()
      done()

    it 'should bump patch', (done) ->
      # act
      config = steps.setup 'test/package.json', 'patch', ''

      # assert
      config.newVersion.should.equal '1.2.4'
      done()

    it 'should bump minor', (done) ->
      # act
      config = steps.setup 'test/package.json', 'minor', ''

      # assert
      config.newVersion.should.equal '1.3.0'
      done()

    it 'should bump major', (done) ->
      # act
      config = steps.setup 'test/package.json', 'major', ''

      # assert
      config.newVersion.should.equal '2.0.0'
      done()

    it 'should create prerelease', (done) ->
      # act
      config = steps.setup 'test/package.json', 'patch', 'beta'

      # assert
      config.newVersion.should.equal '1.2.4-beta'
      done()

  describe 'setup from prerelease version', ->
    before ->
      JSON.stringify(version: '1.2.3-beta.4').to 'test/betapackage.json'

    after ->
      rm 'test/betapackage.json'

    it 'should promote', (done) ->
      # act
      config = steps.setup 'test/betapackage.json', 'promote', ''

      # assert
      config.newVersion.should.equal '1.2.3'
      done()
