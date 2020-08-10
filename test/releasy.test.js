const should = require('should')
const sinon = require('sinon')

const Releasy = require('../lib/releasy.js')
const steps = require('../lib/steps.js')

let sandbox = null

describe('steps', () => {
  it('should exist', () => {
    should(steps).be.ok()
  })
})

describe('releasy', () => {
  beforeEach(() => (sandbox = sinon.createSandbox()))

  afterEach(() => {
    sandbox.restore()
  })

  it('should exist', () => {
    should(Releasy).be.ok()
  })

  it('should call all steps in dry run', () => {
    const options = {
      dryRun: true,
      filename: 'test/fixtures/testpackage.json',
      type: 'patch',
      steps,
      quiet: true,
    }

    sandbox.spy(steps, 'setup')
    sandbox.spy(steps, 'release')
    sandbox.spy(steps, 'preReleasy')
    sandbox.spy(steps, 'postReleasy')
    sandbox.spy(steps, 'scripts')
    sandbox.spy(steps, 'spawn')

    const releasy = Releasy(options)

    releasy.then(function () {
      should(steps.setup.called).be.true
      should(steps.setup.firstCall.returnValue.newVersion).equal('1.0.1')
      should(steps.release.called).be.true
      should(steps.preReleasy.called).be.true
      should(steps.postReleasy.called).be.true
      should(steps.scripts.called).be.true
      should(steps.spawn.args[0][0]).equal('echo pre')

      return should(steps.spawn.args[1][0]).equal('echo post')
    })

    return releasy.fail
  })

  it('should call all steps in dry run using manifest', () => {
    const options = {
      dryRun: true,
      filename: 'test/fixtures/testversionnull.json',
      type: 'patch',
      steps,
      quiet: true,
    }

    sandbox.spy(steps, 'setup')
    sandbox.spy(steps, 'release')
    sandbox.spy(steps, 'preReleasy')
    sandbox.spy(steps, 'postReleasy')
    sandbox.spy(steps, 'scripts')
    sandbox.spy(steps, 'spawn')

    const releasy = Releasy(options)

    releasy.then(function () {
      should(steps.setup.called).be.true
      should(steps.setup.firstCall.returnValue.newVersion).equal('2.0.1')
      should(steps.release.called).be.true
      should(steps.preReleasy.called).be.true
      should(steps.postReleasy.called).be.true
      should(steps.scripts.called).be.true
      should(steps.spawn.args[0][0]).equal('echo pre')

      return should(steps.spawn.args[1][0]).equal('echo post')
    })

    return releasy.fail
  })

  it("should default to manifest.json when file doesn't exist", () => {
    const options = {
      dryRun: true,
      filename: 'test/fixtures/package.json',
      type: 'patch',
      steps,
      quiet: true,
    }

    sandbox.spy(steps, 'setup')
    sandbox.spy(steps, 'release')
    sandbox.spy(steps, 'preReleasy')
    sandbox.spy(steps, 'postReleasy')
    sandbox.spy(steps, 'scripts')
    sandbox.spy(steps, 'spawn')

    const releasy = Releasy(options)

    releasy.then(function () {
      should(steps.setup.called).be.true
      should(steps.setup.firstCall.returnValue.newVersion).equal('2.0.1')
      should(steps.release.called).be.true
      should(steps.release.args[0][0].versionProvider.filePath).equal(
        'test/fixtures/manifest.json'
      )
      should(steps.preReleasy.called).be.true
      should(steps.postReleasy.called).be.true
      should(steps.scripts.called).be.true
      should(steps.spawn.args[0][0]).equal('echo pre')

      return should(steps.spawn.args[1][0]).equal('echo post')
    })

    return releasy.fail
  })
})
