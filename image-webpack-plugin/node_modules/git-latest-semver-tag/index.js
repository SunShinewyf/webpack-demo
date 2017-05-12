'use strict';
var gitSemverTags = require('git-semver-tags');

module.exports = function(cb) {
  gitSemverTags(function(err, tags) {
    if (err) {
      cb(err);
      return;
    }
    cb(null, tags[0] || '');
  });
};
