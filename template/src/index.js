'use strict'

var debug = require('debug')('${name}')
var lib = require('../lib')

module.exports = function () {
  lib()

  debug('application logic')
}
