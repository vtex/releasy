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

    releasy = new Releasy(options)

    releasy.promise.then ->
      steps.setup.called.should.be.true
      steps.release.called.should.be.true
      done()
    releasy.promise.fail (reason) ->
      done(new Error(reason))
