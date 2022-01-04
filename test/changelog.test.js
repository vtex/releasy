const fs = require('fs').promises
const cp = require('child_process')

const mockFs = require('mock-fs')

const releasy = require('../lib/releasy')
const steps = require('../lib/steps')

const defaultOptions = {
  filename: 'package.json',
  type: 'minor',
  commit: false,
  tag: false,
  push: false,
  npm: false,
}

jest.mock('child_process')

jest.spyOn(cp, 'execSync').mockImplementation((cmd, opts) => {
  if (cmd === 'git remote get-url origin') {
    return Buffer.from('https://github.com/my-org/my-repo.git', 'utf-8')
  }

  return cp.execSync(cmd, opts)
})

describe('Changelog', () => {
  describe('with default changelog', () => {
    beforeEach(() => {
      mockFs({
        'package.json': JSON.stringify({
          name: 'my-package',
          version: '0.1.0',
        }),
        'CHANGELOG.md': `
## [Unreleased]
### Changed
- Updated feature 1 to support use-case B.

## [0.1.0] - 2020-10-10
### Added
- Feature 1
`,
      })
    })

    afterEach(() => {
      mockFs.restore()
      jest.restoreAllMocks()
    })

    it('should add new version on changelog after release', async () => {
      jest
        .spyOn(steps, 'preReleasy')
        .mockImplementation(() => Promise.resolve())

      await releasy(defaultOptions)

      const packageContent = JSON.parse(
        (await fs.readFile('./package.json')).toString()
      )

      const changelogContent = (await fs.readFile('./CHANGELOG.md')).toString()

      expect(packageContent.version).toBe('0.2.0')
      expect(changelogContent).toMatch(/\[0\.2\.0\]/)
      expect(changelogContent).toMatch('## [Unreleased]')
    })

    it('should add link to unreleased changes and new tag', async () => {
      jest
        .spyOn(steps, 'preReleasy')
        .mockImplementation(() => Promise.resolve())

      await releasy(defaultOptions)

      const changelogContent = (await fs.readFile('./CHANGELOG.md')).toString()

      expect(changelogContent).toMatch(
        `[0.2.0]: https://github.com/my-org/my-repo/compare/v0.1.0...v0.2.0`
      )
    })
  })

  describe('with empty changelog', () => {
    beforeEach(() => {
      mockFs({
        'package.json': JSON.stringify({ name: 'my-app', version: '0.0.0' }),
        'CHANGELOG.md': `
## [Unreleased]
### Added
- My first feature
`,
      })
    })

    afterEach(() => {
      mockFs.restore()
      jest.restoreAllMocks()
    })

    it('should create one section for newly released tag', async () => {
      jest
        .spyOn(steps, 'preReleasy')
        .mockImplementation(() => Promise.resolve())

      await releasy(defaultOptions)

      const changelogContent = (await fs.readFile('./CHANGELOG.md')).toString()

      const [year, month, day] = new Date()
        .toISOString()
        .split('T')[0]
        .split('-')

      expect(changelogContent).toMatch(`
## [Unreleased]

## [0.1.0] - ${year}-${month}-${day}
### Added
- My first feature


[Unreleased]: https://github.com/my-org/my-repo/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/my-org/my-repo/compare/v0.0.0...v0.1.0`)
    })
  })

  describe('with wrongly formatted changelog', () => {
    beforeEach(() => {
      mockFs({
        'package.json': JSON.stringify({ name: 'my-app', version: '0.0.0' }),
        'CHANGELOG.md': '',
      })
    })

    afterEach(() => {
      mockFs.restore()
      jest.restoreAllMocks()
    })

    it('should log an error', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})

      jest
        .spyOn(steps, 'preReleasy')
        .mockImplementation(() => Promise.resolve())

      await releasy(defaultOptions)

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching('Cannot update your CHANGELOG file.')
      )
    })
  })
})
