should = require 'should'
sinon = require 'sinon'
EventEmitter = require('events').EventEmitter
Releasy = require '../lib/releasy.js'
steps = require '../lib/steps.js'
semver = require 'semver'
testpkg = require './testpackage.json'
sandbox = null

describe 'steps', ->
  it 'should exist', (done) ->
    steps.should.be.ok
    done()

describe 'releasy', ->
  beforeEach ->
    sandbox = sinon.sandbox.create()

  afterEach ->
    sandbox.restore()

  it 'should exist', (done) ->
    Releasy.should.be.ok
    done()

  it 'should call all steps in dry run', (done) ->
    options =
      dryRun: true
      filename: 'test/testpackage.json'
      type: 'patch'
      steps: steps
      quiet: true

    sandbox.spy(steps, "setup")
    sandbox.spy(steps, "release")
    sandbox.spy(steps, "preReleasy")
    sandbox.spy(steps, "postReleasy")
    sandbox.spy(steps, "scripts")
    sandbox.spy(steps, "spawn")

    releasy = new Releasy(options)

    releasy.promise.then ->
      steps.setup.called.should.be.true
      steps.setup.firstCall.returnValue.newVersion.should.equal '1.0.1'
      steps.release.called.should.be.true
      steps.preReleasy.called.should.be.true
      steps.postReleasy.called.should.be.true
      steps.scripts.called.should.be.true
      steps.spawn.args[0][0].should.equal 'echo pre'
      steps.spawn.args[1][0].should.equal 'echo post'
      done()
    releasy.promise.fail done

  it 'should call all steps in dry run using manifest', (done) ->
    options =
      dryRun: true
      filename: 'test/testversionnull.json'
      type: 'patch'
      steps: steps
      quiet: true

    sandbox.spy(steps, "setup")
    sandbox.spy(steps, "release")
    sandbox.spy(steps, "preReleasy")
    sandbox.spy(steps, "postReleasy")
    sandbox.spy(steps, "scripts")
    sandbox.spy(steps, "spawn")

    releasy = new Releasy(options)

    releasy.promise.then ->
      steps.setup.called.should.be.true
      steps.setup.firstCall.returnValue.newVersion.should.equal '2.0.1'
      steps.release.called.should.be.true
      steps.preReleasy.called.should.be.true
      steps.postReleasy.called.should.be.true
      steps.scripts.called.should.be.true
      steps.spawn.args[0][0].should.equal 'echo pre'
      steps.spawn.args[1][0].should.equal 'echo post'
      done()
    releasy.promise.fail done

  it 'should default to manifest.json when file doesn\'t exist', (done) ->
    options =
      dryRun: true
      filename: 'test/package.json'
      type: 'patch'
      steps: steps
      quiet: true

    sandbox.spy(steps, "setup")
    sandbox.spy(steps, "release")
    sandbox.spy(steps, "preReleasy")
    sandbox.spy(steps, "postReleasy")
    sandbox.spy(steps, "scripts")
    sandbox.spy(steps, "spawn")

    releasy = new Releasy(options)

    releasy.promise.then ->
      steps.setup.called.should.be.true
      steps.setup.firstCall.returnValue.newVersion.should.equal '2.0.1'
      steps.release.called.should.be.true
      steps.release.args[0][0].versionProvider.filePath.should.equal('test/manifest.json')
      steps.preReleasy.called.should.be.true
      steps.postReleasy.called.should.be.true
      steps.scripts.called.should.be.true
      steps.spawn.args[0][0].should.equal 'echo pre'
      steps.spawn.args[1][0].should.equal 'echo post'
      done()
    releasy.promise.fail done