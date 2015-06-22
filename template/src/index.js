'use strict'

var debug = require('debug-log')('${name}')
var lib = require('../lib')

module.exports = function () {
  lib()

  debug('application logic')
}
