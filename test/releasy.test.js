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
    Releasy.should.be.ok()
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

    releasy.then(function() {
      steps.setup.called.should.be.true
      steps.setup.firstCall.returnValue.newVersion.should.equal('1.0.1')
      steps.release.called.should.be.true
      steps.preReleasy.called.should.be.true
      steps.postReleasy.called.should.be.true
      steps.scripts.called.should.be.true
      steps.spawn.args[0][0].should.equal('echo pre')
      return steps.spawn.args[1][0].should.equal('echo post')
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

    releasy.then(function() {
      steps.setup.called.should.be.true
      steps.setup.firstCall.returnValue.newVersion.should.equal('2.0.1')
      steps.release.called.should.be.true
      steps.preReleasy.called.should.be.true
      steps.postReleasy.called.should.be.true
      steps.scripts.called.should.be.true
      steps.spawn.args[0][0].should.equal('echo pre')
      return steps.spawn.args[1][0].should.equal('echo post')
    })
    return releasy.fail
  })

  return it("should default to manifest.json when file doesn't exist", () => {
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

    releasy.then(function() {
      steps.setup.called.should.be.true
      steps.setup.firstCall.returnValue.newVersion.should.equal('2.0.1')
      steps.release.called.should.be.true
      steps.release.args[0][0].versionProvider.filePath.should.equal(
        'test/fixtures/manifest.json'
      )
      steps.preReleasy.called.should.be.true
      steps.postReleasy.called.should.be.true
      steps.scripts.called.should.be.true
      steps.spawn.args[0][0].should.equal('echo pre')
      return steps.spawn.args[1][0].should.equal('echo post')
    })
    return releasy.fail
  })
})
