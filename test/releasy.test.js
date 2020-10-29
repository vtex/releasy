const Releasy = require('../lib/releasy.js')
const steps = require('../lib/steps.js')

describe('releasy', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should exist', () => {
    expect(Releasy).toBeTruthy()
  })

  it('should call all steps in dry run', () => {
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
        expect.objectContaining({ tagName: 'v1.0.1 of releasy' })
      )
    })
  })
})
