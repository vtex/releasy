should = require 'should'
Releasy = require '../libs/releasy.js'
steps = require '../libs/steps.js'
semver = require 'semver'
testpkg = require './testpackage.json'
testpkgbeta = require './testpackagebeta.json'

describe 'steps', ->
  it 'should exist', (done) ->
    steps.should.be.ok
    done()

  describe 'with a stable package.json', ->
    it 'should not promote and steps.setup should throw error', (done) ->
      ( ->
        steps.setup('testpackage.json', 'promote', '')
      ).should.throw()
      done()

    it 'should bump patch', (done) ->
      config = steps.setup('test/testpackage.json', 'patch', '')
      config.newVersion.should.equal('1.0.1')
      done()

    it 'should bump minor', (done) ->
      config = steps.setup('test/testpackage.json', 'minor', '')
      config.newVersion.should.equal('1.1.0')
      done()

    it 'should bump major', (done) ->
      config = steps.setup('test/testpackage.json', 'major', '')
      config.newVersion.should.equal('2.0.0')
      done()

    it 'should create prerelease', (done) ->
      config = steps.setup('test/testpackage.json', 'patch', 'beta')
      config.newVersion.should.equal('1.0.1-beta')
      done()

  describe 'with a beta package.json', ->
    it 'should promote', (done) ->
      config = steps.setup('test/testpackagebeta.json', 'promote', '')
      config.newVersion.should.equal('1.0.0')
      done()

describe 'releasy', ->
  it 'should exist', (done) ->
    Releasy.should.be.ok
    done()

  it 'should call all steps in dry run', (done) ->
    releasy = new Releasy({dryRun: true, filename: 'test/testpackage.json', type: 'patch'});
    # create spies on releasy.steps functions...
    releasy.promise.then ->
      # assert that spies were called
      done()
    releasy.promise.fail (reason) ->
      done(new Error(reason))