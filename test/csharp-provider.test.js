const { rm, cat } = require('shelljs')
const semver = require('semver')

const CsharpVersionProvider = require('../lib/providers/csharp.js')
const writeToFile = require('../lib/includes/writeToFile')

describe('CsharpVersionProvider', function() {
  after(() => rm('-rf', 'test/fixtures/AssemblyInfo.cs'))

  describe('reading C# version', function() {
    it('should return SemVer object from informational version', function(done) {
      // arrange
      writeToFile(
        'test/fixtures/AssemblyInfo.cs',
        `\
[assembly: AssemblyVersion("1.2.3")]
[assembly: AssemblyFileVersion("1.2.3")]
[assembly: AssemblyInformationalVersion("1.2.3-beta.4")]\
`
      )
      const provider = new CsharpVersionProvider(
        'test/fixtures/AssemblyInfo.cs'
      )

      // act
      const version = provider.readVersion()

      // assert
      version.format().should.equal('1.2.3-beta.4')
      return done()
    })

    it('should fall back to file version', function(done) {
      // arrange
      writeToFile(
        'test/fixtures/AssemblyInfo.cs',
        `\
[assembly: AssemblyVersion("1.2.3")]
[assembly: AssemblyFileVersion("1.2.3")]\
`
      )
      const provider = new CsharpVersionProvider(
        'test/fixtures/AssemblyInfo.cs'
      )

      // act
      const version = provider.readVersion()

      // assert
      version.format().should.equal('1.2.3')
      return done()
    })

    it('should fall back to assembly version', function(done) {
      // arrange
      writeToFile(
        'test/fixtures/AssemblyInfo.cs',
        `\
[assembly: AssemblyVersion("1.2.3")]\
`
      )
      const provider = new CsharpVersionProvider(
        'test/fixtures/AssemblyInfo.cs'
      )

      // act
      const version = provider.readVersion()

      // assert
      version.format().should.equal('1.2.3')
      return done()
    })

    return it('should throw an error if a version cannot be found', function(done) {
      // arrange
      writeToFile(
        'test/fixtures/AssemblyInfo.cs',
        `\
// no version in here!\
`
      )
      const provider = new CsharpVersionProvider(
        'test/fixtures/AssemblyInfo.cs'
      )

      // act & assert
      ;(() => provider.readVersion()).should.throw(
        'Could not find version information in file test/fixtures/AssemblyInfo.cs'
      )
      return done()
    })
  })

  describe('writing C# version', function() {
    it('should accept SemVer object', function(done) {
      // arrange
      writeToFile(
        'test/fixtures/AssemblyInfo.cs',
        `\
[assembly: AssemblyVersion("1.2.3")]
[assembly: AssemblyFileVersion("1.2.3")]
[assembly: AssemblyInformationalVersion("1.2.3-beta.4")]\
`
      )
      const provider = new CsharpVersionProvider(
        'test/fixtures/AssemblyInfo.cs'
      )

      // act
      provider.writeVersion(semver('2.3.4-alpha.5'))

      // assert
      cat('test/fixtures/AssemblyInfo.cs').should.equal(
        `\
[assembly: AssemblyVersion("2.3.4")]
[assembly: AssemblyFileVersion("2.3.4")]
[assembly: AssemblyInformationalVersion("2.3.4-alpha.5")]\
`
      )
      return done()
    })

    it('should accept string version', function(done) {
      // arrange
      writeToFile(
        'test/fixtures/AssemblyInfo.cs',
        `\
[assembly: AssemblyVersion("1.2.3")]
[assembly: AssemblyFileVersion("1.2.3")]
[assembly: AssemblyInformationalVersion("1.2.3-beta.4")]\
`
      )
      const provider = new CsharpVersionProvider(
        'test/fixtures/AssemblyInfo.cs'
      )

      // act
      provider.writeVersion('2.3.4-alpha.5')

      // assert
      cat('test/fixtures/AssemblyInfo.cs').should.equal(
        `\
[assembly: AssemblyVersion("2.3.4")]
[assembly: AssemblyFileVersion("2.3.4")]
[assembly: AssemblyInformationalVersion("2.3.4-alpha.5")]\
`
      )
      return done()
    })

    it('should append missing version attributes', function(done) {
      // arrange
      writeToFile(
        'test/fixtures/AssemblyInfo.cs',
        `\
[assembly: AssemblyVersion("1.2.3")]
// nothing else\
`
      )
      const provider = new CsharpVersionProvider(
        'test/fixtures/AssemblyInfo.cs'
      )

      // act
      provider.writeVersion('2.3.4-alpha.5')

      // assert
      cat('test/fixtures/AssemblyInfo.cs').should.equal(
        `\
[assembly: AssemblyVersion("2.3.4")]
// nothing else
[assembly: AssemblyFileVersion("2.3.4")]
[assembly: AssemblyInformationalVersion("2.3.4-alpha.5")]
\
`
      )
      return done()
    })

    it('should not mess line endings', function(done) {
      writeToFile(
        'test/fixtures/AssemblyInfo.cs',
        '// [assembly: AssemblyVersion("x.x.x")]\r\n[assembly: AssemblyVersion("2.3.5")]\r\n[assembly: AssemblyFileVersion("2.3.5")]\r\n[assembly: AssemblyInformationalVersion("2.3.5-beta.3")]\r\n'
      )

      const provider = new CsharpVersionProvider(
        'test/fixtures/AssemblyInfo.cs'
      )

      // act
      provider.writeVersion('2.3.4-alpha.5')

      // assert
      cat('test/fixtures/AssemblyInfo.cs').should.equal(
        '// [assembly: AssemblyVersion("2.3.4")]\r\n[assembly: AssemblyVersion("2.3.4")]\r\n[assembly: AssemblyFileVersion("2.3.4")]\r\n[assembly: AssemblyInformationalVersion("2.3.4-alpha.5")]\r\n'
      )
      return done()
    })

    return it('should append missing attributes without breaking extra line', function(done) {
      // arrange
      writeToFile(
        'test/fixtures/AssemblyInfo.cs',
        `\
// [assembly: AssemblyVersion("2.3.5")]
[assembly: AssemblyVersion("2.3.5")]
[assembly: AssemblyInformationalVersion("2.3.5-beta.3")]
\
`
      )
      const provider = new CsharpVersionProvider(
        'test/fixtures/AssemblyInfo.cs'
      )

      // act
      provider.writeVersion('2.3.4-alpha.5')

      // assert
      cat('test/fixtures/AssemblyInfo.cs').should.equal(
        `\
// [assembly: AssemblyVersion("2.3.4")]
[assembly: AssemblyVersion("2.3.4")]
[assembly: AssemblyInformationalVersion("2.3.4-alpha.5")]
[assembly: AssemblyFileVersion("2.3.4")]
\
`
      )
      return done()
    })
  })

  return describe('file support', function() {
    it('should support .cs extensions', function() {
      // act
      const supports = CsharpVersionProvider.supports('somefile.cs')

      // assert
      return supports.should.be.true
    })

    return it('should not support any other extension', function() {
      // act
      const supports = CsharpVersionProvider.supports('arbitrary.extension')

      // assert
      return supports.should.be.false
    })
  })
})
