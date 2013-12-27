expect = require 'expect.js'
releasy = require '../releasy.js'
steps = require '../libs/steps.js'

describe 'exist', ->

  it "should exist", (done) ->
    expect(releasy).to.be.ok()
    done()

  it "should exist", (done) ->
    expect(steps).to.be.ok()
    done()

describe 'add', ->

  it "should...", (done) ->
    #expect something
    done()