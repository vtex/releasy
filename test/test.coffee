should = require 'should'
releasy = require '../releasy.js'
steps = require '../libs/steps.js'
semver = require 'semver'
testpkg = require '../testpackage.json'

describe 'steps', ->

  it 'should exist', (done) ->

    steps.should.be.ok

    done()

describe 'releasy', ->

  it 'should exist', (done) ->

    releasy.should.be.ok

    done()

describe 'pkg.version', ->

  it 'should not be promoted and steps.setup should throw error', (done) ->

    ( ->
      steps.setup('testpackage.json', 'promote', '')
    ).should.throw()

    done()

describe 'pkg.version', ->

  it 'should not cause steps.setup to throw error', (done) ->

    testpkg.version = testpkg.version + '-beta'

    ( ->
      steps.setup('testpackage.json', 'promote', '')
    ).should.not.throw()

    testpkg.version = testpkg.version.replace('-beta', '')

    done()

