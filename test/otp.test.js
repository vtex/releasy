const prompt = require('prompt')
const mockFs = require('mock-fs')

const releasy = require('../lib/releasy')
const steps = require('../lib/steps')

describe('npm OTP', () => {
  beforeEach(() => {
    mockFs({
      'package.json': JSON.stringify({
        version: '0.0.0',
      }),
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
    mockFs.restore()
  })

  it('should ask for a otp if 2FA is enabled', async () => {
    jest.spyOn(steps, 'status').mockReturnValue('nothing to commit')
    jest.spyOn(prompt, 'get').mockImplementationOnce((schema, callback) => {
      callback(null, { [schema.name]: '123456' })
    })

    const runSpy = jest.spyOn(steps, 'run').mockImplementation((cmd) => {
      if (cmd === 'npm publish') {
        // Pretend user has 2FA active
        return Promise.reject(new Error('npm ERR! code EOTP'))
      }

      return 'ok'
    })

    await releasy({
      filename: 'package.json',
      type: 'minor',
      npm: true,
    })

    expect(runSpy).toHaveBeenCalledTimes(2)
    expect(runSpy).toHaveBeenLastCalledWith(
      'npm publish --otp 123456',
      expect.anything(),
      undefined,
      true
    )
    mockFs.restore()
  })

  it('should cancel publish if no otp is provided', async () => {
    jest.spyOn(steps, 'status').mockReturnValue('nothing to commit')
    jest.spyOn(prompt, 'get').mockImplementationOnce((schema, callback) => {
      callback(null, { [schema.name]: '' })
    })
    const publishSpy = jest.spyOn(steps, 'publish')
    const runSpy = jest.spyOn(steps, 'run').mockImplementation((cmd) => {
      if (cmd === 'npm publish') {
        // Pretend user has 2FA active
        return Promise.reject(new Error('npm ERR! code EOTP'))
      }

      return 'ok'
    })

    await releasy({
      filename: 'package.json',
      type: 'minor',
      npm: true,
    })

    expect(publishSpy).toHaveBeenCalledTimes(1)
    await expect(publishSpy.mock.results[0].value).rejects.toBe(
      'Cancelled by user'
    )
    expect(runSpy).toHaveBeenCalledTimes(1)
    expect(runSpy).toHaveBeenLastCalledWith(
      'npm publish',
      expect.anything(),
      undefined,
      true
    )
    mockFs.restore()
  })

  it('should fail to publish if incorrect otp is passed via CLI options', async () => {
    jest.spyOn(steps, 'status').mockReturnValue('nothing to commit')

    const publishSpy = jest.spyOn(steps, 'publish')
    const runSpy = jest.spyOn(steps, 'run').mockImplementation((cmd) => {
      if (cmd === 'npm publish --otp 123456') {
        return Promise.reject(new Error('npm ERR! code EOTP'))
      }

      return 'ok'
    })

    await releasy({
      filename: 'package.json',
      type: 'minor',
      npm: true,
      otp: '123456',
    })

    expect(publishSpy).toHaveReturnedTimes(1)
    await expect(publishSpy.mock.results[0].value).rejects.toThrow(
      'OTP code is incorrect or expired and you have runned out of attemps'
    )
    expect(runSpy).toHaveBeenCalledTimes(1)
    expect(runSpy).toHaveBeenLastCalledWith(
      'npm publish --otp 123456',
      expect.anything(),
      undefined,
      true
    )
    mockFs.restore()
  })
})
