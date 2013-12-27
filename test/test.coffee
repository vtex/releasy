expect = require 'expect.js'
releasy = require '../releasy.js'
steps = require '../libs/steps.js'

describe 'exist', ->

  it 'should exist', (done) ->
    expect(releasy).to.be.ok()
    done()

  it 'should exist', (done) ->
    expect(steps).to.be.ok()
    done()

describe 'setup', ->

  it 'should be a function', (done) ->
    expect(steps.setup).to.be.a('function')
    done()

describe 'run', ->

  it 'should be a function', (done) ->
    expect(steps.run).to.be.a('function')
    done()

describe 'bump', ->

  it 'should be a function', (done) ->
    expect(steps.bump).to.be.a('function')
    done()

describe 'add', ->

  it 'should be a function', (done) ->
    expect(steps.add).to.be.a('function')
    done()

describe 'commit', ->

  it 'should be a function', (done) ->
    expect(steps.commit).to.be.a('function')
    done()

describe 'tag', ->

  it 'should be a function', (done) ->
    expect(steps.tag).to.be.a('function')
    done()

describe 'push', ->

  it 'should be a function', (done) ->
    expect(steps.push).to.be.a('function')
    done()

describe 'publish', ->

  it 'should be a function', (done) ->
    expect(steps.publish).to.be.a('function')
    done()

