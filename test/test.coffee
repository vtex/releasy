should = require 'should'
releasy = require '../releasy.js'
steps = require '../libs/steps.js'
semver = require 'semver'

describe 'steps', ->

  it 'should exist', (done) ->
    steps.should.be.ok
    done()

describe 'pkg.version', ->

  it 'should not be promoted', (done) ->
    ( ->
      steps.setup('package.json', 'promote', '')
    ).should.throw()
    done()

describe 'releasy', ->

  it 'should exist', (done) ->
    releasy.should.be.ok
    done()