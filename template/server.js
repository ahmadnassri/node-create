'use strict'

var dotenv = require('dotenv')

dotenv.config({ silent: true })
dotenv.config({ silent: true, path: '.env.' + process.env.NODE_ENV })

var app = require('./src')

app()
