'use strict'

var child_process = require('child_process')
var debug = require('debug-log')('npm-package-generator')
var dotenv = require('dotenv')
var fs = require('fs')
var glob = require('glob-promise')
var mkdirp = require('mkdirp-promise')
var path = require('path')
var read = require('read-files-promise')
var template = require('lodash.template')
var write = require('fs-writefile-promise')

dotenv.config({ silent: true })
dotenv.config({ silent: true, path: '.env.' + process.env.NODE_ENV })

module.exports = function (options) {
  var opts = {
    author: options.author || process.env.NPM_AUTHOR_NAME,
    description: options.description || process.env.NPM_PACKAGE_DESCRIPTION,
    email: options.email || process.env.NPM_AUTHOR_EMAIL,
    github: options.github || process.env.NPM_GITHUB_USERNAME,
    install: options.install || false,
    name: options.name || process.env.NPM_PACKAGE_NAME,
    quiet: options.quiet || false,
    target: options.target || process.cwd(),
    website: options.website || process.env.NPM_AUTHOR_WEBSITE,
    year: new Date().getFullYear()
  }

  debug('options %j', opts)

  var templates = []

  return mkdirp(path.join(opts.target, 'test', 'fixtures'))
    .then(function () {
      return glob('template/**/*', {
        cwd: path.join(__dirname, '..'),
        dot: true,
        nodir: true,
        realpath: true
      })
    })

    .then(function (_templates) {
      templates = _templates

      return templates
    })

    .then(read)

    // process tempaltes
    .then(function (buffers) {
      return buffers.reduce(function (files, buffer, index, buffers) {
        // re-construct name
        var name = path.relative(path.join(__dirname, '..', 'template'), templates[index])

        // construct new mapping object
        files[name] = template(buffer)(opts)

        return files
      }, {})
    })

    .then(function (files) {
      var promises = []

      Object.keys(files).forEach(function (name) {
        var filename = path.join(opts.target, name)
        var dir = path.dirname(filename)

        debug('writing to %s', filename)

        promises.push(mkdirp(dir).then(function () {
          return write(filename, files[name])
        }))
      })

      return Promise.all(promises)
    })

    // rename bin/bin
    .then(function (files) {
      fs.renameSync(path.join(opts.target, 'bin', 'bin'), path.join(opts.target, 'bin', opts.name))

      return files
    })

    .then(function (files) {
      if (opts.install) {
        child_process.execFileSync('npm', ['update', '--save'], {
          stdio: opts.quiet ? 'pipe' : 'inherit',
          cwd: opts.target
        })
      }

      return files
    })

    .then(function (files) {
      if (opts.install) {
        child_process.execFileSync('npm', ['update', '--save-dev'], {
          stdio: opts.quiet ? 'pipe' : 'inherit',
          cwd: opts.target
        })
      }

      return files.sort()
    })
}
