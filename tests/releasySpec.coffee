expect  = require 'expect.js'
deploy = require '../releasy.js'
steps = require '../libs/steps.js'

describe 'deploy', ->
  it "should exist", (done) ->
    expect(deploy).to.be.ok()
    done()

describe 'steps', ->
  it "should exist", (done) ->
    expect(deploy).to.be.ok()
    done()