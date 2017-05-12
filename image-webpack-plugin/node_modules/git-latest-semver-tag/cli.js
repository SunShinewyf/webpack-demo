#!/usr/bin/env node
'use strict';
var meow = require('meow');
var gitLatestSemverTag = require('./');

meow({
  help: [
    'Usage',
    '  git-latest-semver-tag'
  ]
});

gitLatestSemverTag(function(err, tag) {
  if (err) {
    console.error(err.toString());
    process.exit(1);
  }

  console.log(tag);
});
