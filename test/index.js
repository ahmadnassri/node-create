/* global afterEach, describe, it, */

'use strict'

var generator = require('..')
var fs = require('fs')
var path = require('path')
var mkdirp = require('mkdirp-promise')
var read = require('fs-readfile-promise')
var rimraf = require('rimraf')
var util = require('util')

var should = require('should')

var target = path.join('test', 'tmp')

describe('npm package generator', function () {
  afterEach(function (done) {
    rimraf(target, done)
  })

  it('should populate template variables', function (done) {
    var options = {
      author: 'foo',
      description: 'foo bar',
      email: 'foo@bar.com',
      github: 'foo',
      name: 'foobar',
      target: target,
      website: 'foo.com'
    }

    generator(options)
      .then(function () {
        return read('test/tmp/package.json')
      })
      .then(JSON.parse)
      .then(function (pkg) {
        pkg.should.be.an.Object

        pkg.name.should.equal(options.name)
        pkg.description.should.equal(options.description)
        pkg.author.should.equal(util.format('%s <%s> (%s)', options.author, options.email, options.website))
        pkg.homepage.should.equal(util.format('https://github.com/%s/%s', options.github, options.name))

        done()
      })
      .catch(function (err) {
        console.log(err)
        should.fail(err)
        done()
      })
  })

  it('should use process.cwd', function (done) {
    var cwd = process.cwd()

    mkdirp(target).then(function (made) {
      process.chdir(made)

      var options = {
        author: 'foo',
        description: 'foo bar',
        email: 'foo@bar.com',
        github: 'foo',
        name: 'foobar',
        website: 'foo.com'
      }

      return generator(options)
        .then(function (files) {
          var file = path.dirname(files.pop())

          file.should.be.a.String
          path.relative(file, made).should.eql('..')

          // return to cwd
          process.chdir(cwd)

          done()
        })
    })
  })

  it('should return a list of files created', function (done) {
    var options = {
      author: 'foo',
      description: 'foo bar',
      email: 'foo@bar.com',
      github: 'foo',
      name: 'foobar',
      target: target,
      website: 'foo.com'
    }

    generator(options)
      .then(function (files) {
        files.should.be.an.Array
        files.should.eql([
          'test/tmp/.editorconfig',
          'test/tmp/.env.example',
          'test/tmp/.gitattributes',
          'test/tmp/.gitignore',
          'test/tmp/.jshintrc',
          'test/tmp/.npmignore',
          'test/tmp/.travis.yml',
          'test/tmp/bin/bin',
          'test/tmp/docs/API.md',
          'test/tmp/docs/INSTALL.md',
          'test/tmp/lib/index.js',
          'test/tmp/LICENSE',
          'test/tmp/package.json',
          'test/tmp/README.md',
          'test/tmp/server.js',
          'test/tmp/src/index.js',
          'test/tmp/test/index.js'
        ])

        done()
      })
  })

  it('should use environment variables', function (done) {
    process.env.AUTHOR_EMAIL = 'foo@bar.com'
    process.env.AUTHOR_NAME = 'foo'
    process.env.AUTHOR_WEBSITE = 'foo.com'
    process.env.GITHUB_USERNAME = 'foo'
    process.env.PACKAGE_NAME = 'foobar'

    generator({
      target: target
    })

      .then(function () {
        return read('test/tmp/package.json')
      })
      .then(JSON.parse)
      .then(function (pkg) {
        pkg.name.should.equal(process.env.PACKAGE_NAME)

        done()
      })
  })

  it('should install dependencies', function (done) {
    this.timeout(20000)

    var options = {
      install: true,
      quiet: true,
      target: target
    }

    generator(options)
      .then(function () {
        fs.existsSync(path.join(target, 'node_modules')).should.be.true

        done()
      })
  })
})
