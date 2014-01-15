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
