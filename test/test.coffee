should = require 'should'
sinon = require 'sinon'
EventEmitter = require('events').EventEmitter
Releasy = require '../lib/releasy.js'
steps = require '../lib/steps.js'
semver = require 'semver'
testpkg = require './testpackage.json'

describe 'steps', ->
  it 'should exist', (done) ->
    steps.should.be.ok
    done()

describe 'releasy', ->
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

    sinon.spy(steps, "setup")
    sinon.spy(steps, "release")
    sinon.spy(steps, "preReleasy")
    sinon.spy(steps, "postReleasy")
    sinon.spy(steps, "scripts")
    sinon.spy(steps, "spawn")

    releasy = new Releasy(options)

    releasy.promise.then ->
      steps.setup.called.should.be.true
      steps.release.called.should.be.true
      steps.preReleasy.called.should.be.true
      steps.postReleasy.called.should.be.true
      steps.scripts.called.should.be.true
      steps.spawn.args[0][0].should.equal 'echo pre'
      steps.spawn.args[1][0].should.equal 'echo post'
      done()
    releasy.promise.fail done
