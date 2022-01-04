const fs = require('fs')

const Releasy = require('../lib/releasy.js')
const steps = require('../lib/steps.js')
const { createPackageJson, MANIFEST } = require('./utils')

describe('releasy', () => {
  afterEach(() => {
    if (fs.existsSync('test/fixtures/manifest.json'))
      fs.unlinkSync('test/fixtures/manifest.json')
    jest.restoreAllMocks()
  })

  it('should call all steps in dry run', () => {
    createPackageJson('test/fixtures/manifest.json', MANIFEST)

    const options = {
      dryRun: true,
      filename: 'test/fixtures/testpackage.json',
      type: 'patch',
      steps,
      quiet: true,
    }

    const setupSpy = jest.spyOn(steps, 'setup')
    const releaseSpy = jest.spyOn(steps, 'release')
    const preReleasySpy = jest.spyOn(steps, 'preReleasy')
    const postReleasySpy = jest.spyOn(steps, 'postReleasy')
    const scriptsSpy = jest.spyOn(steps, 'scripts')
    const spawnSpy = jest.spyOn(steps, 'spawn')

    const releasy = Releasy(options)

    return releasy.then(() => {
      expect(setupSpy).toHaveBeenCalled()
      expect(setupSpy).toHaveReturnedWith(
        expect.objectContaining({ newVersion: '1.0.1' })
      )
      expect(releaseSpy).toHaveBeenCalled()
      expect(preReleasySpy).toHaveBeenCalled()
      expect(postReleasySpy).toHaveBeenCalled()
      expect(scriptsSpy).toHaveBeenCalled()
      expect(spawnSpy).toHaveBeenNthCalledWith(
        1,
        'echo pre',
        'Pre releasy',
        true,
        true
      )
      expect(spawnSpy).toHaveBeenNthCalledWith(
        2,
        'echo post',
        'Post releasy',
        true,
        true
      )
    })
  })

  it('should call all steps in dry run using manifest', () => {
    createPackageJson('test/fixtures/manifest.json', MANIFEST)

    const options = {
      dryRun: true,
      filename: 'test/fixtures/testversionnull.json',
      type: 'patch',
      steps,
      quiet: true,
    }

    const setupSpy = jest.spyOn(steps, 'setup')
    const releaseSpy = jest.spyOn(steps, 'release')
    const preReleasySpy = jest.spyOn(steps, 'preReleasy')
    const postReleasySpy = jest.spyOn(steps, 'postReleasy')
    const scriptsSpy = jest.spyOn(steps, 'scripts')
    const spawnSpy = jest.spyOn(steps, 'spawn')

    const releasy = Releasy(options)

    return releasy.then(() => {
      expect(setupSpy).toHaveBeenCalled()
      expect(setupSpy).toHaveReturnedWith(
        expect.objectContaining({ newVersion: '0.3.1' })
      )
      expect(releaseSpy).toHaveBeenCalled()
      expect(preReleasySpy).toHaveBeenCalled()
      expect(postReleasySpy).toHaveBeenCalled()
      expect(scriptsSpy).toHaveBeenCalled()
      expect(spawnSpy).toHaveBeenNthCalledWith(
        1,
        'echo pre',
        'Pre releasy',
        true,
        true
      )
      expect(spawnSpy).toHaveBeenNthCalledWith(
        2,
        'echo post',
        'Post releasy',
        true,
        true
      )
    })
  })

  it("should default to manifest.json when file doesn't exist", () => {
    createPackageJson('test/fixtures/manifest.json', MANIFEST)

    const options = {
      dryRun: true,
      filename: 'test/fixtures/package.json',
      type: 'patch',
      steps,
      quiet: true,
    }

    const setupSpy = jest.spyOn(steps, 'setup')
    const releaseSpy = jest.spyOn(steps, 'release')
    const preReleasySpy = jest.spyOn(steps, 'preReleasy')
    const postReleasySpy = jest.spyOn(steps, 'postReleasy')
    const scriptsSpy = jest.spyOn(steps, 'scripts')
    const spawnSpy = jest.spyOn(steps, 'spawn')

    const releasy = Releasy(options)

    return releasy.then(() => {
      expect(setupSpy).toHaveBeenCalled()
      expect(setupSpy).toHaveReturnedWith(
        expect.objectContaining({ newVersion: '0.3.1' })
      )
      expect(releaseSpy).toHaveBeenCalled()
      expect(releaseSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          versionProvider: expect.objectContaining({
            filePath: expect.arrayContaining(['test/fixtures/manifest.json']),
          }),
        }),
        expect.anything()
      )
      expect(preReleasySpy).toHaveBeenCalled()
      expect(postReleasySpy).toHaveBeenCalled()
      expect(scriptsSpy).toHaveBeenCalled()
      expect(spawnSpy).toHaveBeenNthCalledWith(
        1,
        'echo pre',
        'Pre releasy',
        true,
        true
      )
      expect(spawnSpy).toHaveBeenNthCalledWith(
        2,
        'echo post',
        'Post releasy',
        true,
        true
      )
    })
  })

  it('should use the package name', () => {
    const options = {
      dryRun: true,
      filename: 'test/fixtures/testpackage.json',
      type: 'patch',
      steps,
      quiet: true,
      displayName: true,
    }

    const setupSpy = jest.spyOn(steps, 'setup')
    const releasy = Releasy(options)

    return releasy.then(() => {
      expect(setupSpy).toHaveBeenCalled()
      expect(setupSpy).toHaveReturnedWith(
        expect.objectContaining({ tagName: 'releasy@1.0.1' })
      )
    })
  })
})
