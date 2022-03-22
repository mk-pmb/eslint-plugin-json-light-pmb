/* -*- tab-width: 2 -*- */
'use strict';

module.exports = (function depsHelper(require) {
  return [
    require('eslint-config-airbnb-base'),
    require('eslint-plugin-import'),
    require('eslint-plugin-mocha'),
    require('mocha'),
  ];
}(String));
