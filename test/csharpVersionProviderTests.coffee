should = require 'should'
require 'shelljs/global'
semver = require 'semver'

CsharpVersionProvider = require '../libs/csharpVersionProvider.js'

createFile = (filePath, contents) ->
  contents.to filePath

describe 'CsharpVersionProvider', ->
  after ->
    rm '-rf', 'test/AssemblyInfo.cs'

  describe 'reading C# version', ->
    it 'should return SemVer object from informational version', (done) ->
      # arrange
      createFile 'test/AssemblyInfo.cs',
        """
        [assembly: AssemblyVersion("1.2.3")]
        [assembly: AssemblyFileVersion("1.2.3")]
        [assembly: AssemblyInformationalVersion("1.2.3-beta.4")]
        """
      provider = new CsharpVersionProvider 'test/AssemblyInfo.cs'

      # act
      version = provider.readVersion()

      # assert
      version.format().should.equal '1.2.3-beta.4'
      done()

    it 'should fall back to file version', (done) ->
      # arrange
      createFile 'test/AssemblyInfo.cs',
        """
        [assembly: AssemblyVersion("1.2.3")]
        [assembly: AssemblyFileVersion("1.2.3")]
        """
      provider = new CsharpVersionProvider 'test/AssemblyInfo.cs'

      # act
      version = provider.readVersion()

      # assert
      version.format().should.equal '1.2.3'
      done()

    it 'should fall back to assembly version', (done) ->
      # arrange
      createFile 'test/AssemblyInfo.cs',
        """
        [assembly: AssemblyVersion("1.2.3")]
        """
      provider = new CsharpVersionProvider 'test/AssemblyInfo.cs'

      # act
      version = provider.readVersion()

      # assert
      version.format().should.equal '1.2.3'
      done()

    it 'should throw an error if a version cannot be found', (done) ->
      # arrange
      createFile 'test/AssemblyInfo.cs',
        """
        // no version in here!
        """
      provider = new CsharpVersionProvider 'test/AssemblyInfo.cs'

      # act & assert
      ( ->
        provider.readVersion()
      ).should.throw 'Could not find version information in file test/AssemblyInfo.cs'
      done()

  describe 'writing C# version', ->
    it 'should accept SemVer object', (done) ->
      # arrange
      createFile 'test/AssemblyInfo.cs',
        """
        [assembly: AssemblyVersion("1.2.3")]
        [assembly: AssemblyFileVersion("1.2.3")]
        [assembly: AssemblyInformationalVersion("1.2.3-beta.4")]
        """
      provider = new CsharpVersionProvider 'test/AssemblyInfo.cs'

      # act
      provider.writeVersion semver('2.3.4-alpha.5')

      # assert
      cat('test/AssemblyInfo.cs').should.equal(
        """
        [assembly: AssemblyVersion("2.3.4")]
        [assembly: AssemblyFileVersion("2.3.4")]
        [assembly: AssemblyInformationalVersion("2.3.4-alpha.5")]
        """)
      done()

    it 'should accept string version', (done) ->
      # arrange
      createFile 'test/AssemblyInfo.cs',
        """
        [assembly: AssemblyVersion("1.2.3")]
        [assembly: AssemblyFileVersion("1.2.3")]
        [assembly: AssemblyInformationalVersion("1.2.3-beta.4")]
        """
      provider = new CsharpVersionProvider 'test/AssemblyInfo.cs'

      # act
      provider.writeVersion '2.3.4-alpha.5'

      # assert
      cat('test/AssemblyInfo.cs').should.equal(
        """
        [assembly: AssemblyVersion("2.3.4")]
        [assembly: AssemblyFileVersion("2.3.4")]
        [assembly: AssemblyInformationalVersion("2.3.4-alpha.5")]
        """)
      done()

    it 'should append missing version attributes', (done) ->
      # arrange
      createFile 'test/AssemblyInfo.cs',
        """
        [assembly: AssemblyVersion("1.2.3")]
        // nothing else
        """
      provider = new CsharpVersionProvider 'test/AssemblyInfo.cs'

      # act
      provider.writeVersion '2.3.4-alpha.5'

      # assert
      cat('test/AssemblyInfo.cs').should.equal(
        """
        [assembly: AssemblyVersion("2.3.4")]
        // nothing else
        [assembly: AssemblyFileVersion("2.3.4")]
        [assembly: AssemblyInformationalVersion("2.3.4-alpha.5")]
        
        """)
      done()

    it 'should not mess line endings', (done) ->
      createFile('test/AssemblyInfo.cs',
        '// [assembly: AssemblyVersion("x.x.x")]\r\n[assembly: AssemblyVersion("2.3.5")]\r\n[assembly: AssemblyFileVersion("2.3.5")]\r\n[assembly: AssemblyInformationalVersion("2.3.5-beta.3")]\r\n')

      provider = new CsharpVersionProvider 'test/AssemblyInfo.cs'

      # act
      provider.writeVersion '2.3.4-alpha.5'

      # assert
      cat('test/AssemblyInfo.cs').should.equal(
        '// [assembly: AssemblyVersion("2.3.4")]\r\n[assembly: AssemblyVersion("2.3.4")]\r\n[assembly: AssemblyFileVersion("2.3.4")]\r\n[assembly: AssemblyInformationalVersion("2.3.4-alpha.5")]\r\n')
      done()

    it 'should append missing attributes without breaking extra line', (done) ->
      # arrange
      createFile 'test/AssemblyInfo.cs',
        """
        // [assembly: AssemblyVersion("2.3.5")]
        [assembly: AssemblyVersion("2.3.5")]
        [assembly: AssemblyInformationalVersion("2.3.5-beta.3")]

        """
      provider = new CsharpVersionProvider 'test/AssemblyInfo.cs'

      # act
      provider.writeVersion '2.3.4-alpha.5'

      # assert
      cat('test/AssemblyInfo.cs').should.equal(
        """
        // [assembly: AssemblyVersion("2.3.4")]
        [assembly: AssemblyVersion("2.3.4")]
        [assembly: AssemblyInformationalVersion("2.3.4-alpha.5")]
        [assembly: AssemblyFileVersion("2.3.4")]

        """)
      done()

  describe 'file support', ->
    it 'should support .cs extensions', ->
      # act
      supports = CsharpVersionProvider.supports 'somefile.cs'

      # assert
      supports.should.be.true

    it 'should not support any other extension', ->
      # act
      supports = CsharpVersionProvider.supports 'arbitrary.extension'

      # assert
      supports.should.be.false
