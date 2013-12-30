should = require 'should'
releasy = require '../releasy.js'
steps = require '../libs/steps.js'

describe 'steps', ->

  it 'should exist', (done) ->
    steps.should.be.ok
    done()



describe 'releasy', ->
  
  it 'should exist', (done) ->
    releasy.should.be.ok
    done()