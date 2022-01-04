const fs = require('fs')

const semver = require('semver')

const CsharpVersionProvider = require('../lib/providers/csharp.js')
const writeToFile = require('../lib/includes/writeToFile')

describe('CsharpVersionProvider', () => {
  afterEach(() => {
    if (fs.existsSync('test/fixtures/AssemblyInfo.cs'))
      fs.unlinkSync('test/fixtures/AssemblyInfo.cs')
  })

  describe('reading C# version', () => {
    it('should return SemVer object from informational version', () => {
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
      expect(version.format()).toBe('1.2.3-beta.4')
    })

    it('should fall back to file version', () => {
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
      expect(version.format()).toBe('1.2.3')
    })

    it('should fall back to assembly version', () => {
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
      expect(version.format()).toBe('1.2.3')
    })

    it('should throw an error if a version cannot be found', () => {
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
      expect(() => provider.readVersion()).toThrow(
        'Could not find version information in file test/fixtures/AssemblyInfo.cs'
      )
    })
  })

  describe('writing C# version', () => {
    it('should accept SemVer object', () => {
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
      expect(fs.readFileSync('test/fixtures/AssemblyInfo.cs').toString()).toBe(
        `\
[assembly: AssemblyVersion("2.3.4")]
[assembly: AssemblyFileVersion("2.3.4")]
[assembly: AssemblyInformationalVersion("2.3.4-alpha.5")]\
`
      )
    })

    it('should accept string version', () => {
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
      expect(fs.readFileSync('test/fixtures/AssemblyInfo.cs').toString()).toBe(
        `\
[assembly: AssemblyVersion("2.3.4")]
[assembly: AssemblyFileVersion("2.3.4")]
[assembly: AssemblyInformationalVersion("2.3.4-alpha.5")]\
`
      )
    })

    it('should append missing version attributes', () => {
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
      expect(fs.readFileSync('test/fixtures/AssemblyInfo.cs').toString()).toBe(
        `\
[assembly: AssemblyVersion("2.3.4")]
// nothing else
[assembly: AssemblyFileVersion("2.3.4")]
[assembly: AssemblyInformationalVersion("2.3.4-alpha.5")]
\
`
      )
    })

    it('should not mess line endings', () => {
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
      expect(fs.readFileSync('test/fixtures/AssemblyInfo.cs').toString()).toBe(
        '// [assembly: AssemblyVersion("2.3.4")]\r\n[assembly: AssemblyVersion("2.3.4")]\r\n[assembly: AssemblyFileVersion("2.3.4")]\r\n[assembly: AssemblyInformationalVersion("2.3.4-alpha.5")]\r\n'
      )
    })

    it('should append missing attributes without breaking extra line', () => {
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
      expect(fs.readFileSync('test/fixtures/AssemblyInfo.cs').toString()).toBe(
        `\
// [assembly: AssemblyVersion("2.3.4")]
[assembly: AssemblyVersion("2.3.4")]
[assembly: AssemblyInformationalVersion("2.3.4-alpha.5")]
[assembly: AssemblyFileVersion("2.3.4")]
\
`
      )
    })
  })

  describe('file support', () => {
    it('should support .cs extensions', () => {
      // act
      const supports = CsharpVersionProvider.supports('somefile.cs')

      // assert
      return expect(supports).toBe(true)
    })

    it('should not support any other extension', () => {
      // act
      const supports = CsharpVersionProvider.supports('arbitrary.extension')

      // assert
      return expect(supports).toBe(false)
    })
  })
})
