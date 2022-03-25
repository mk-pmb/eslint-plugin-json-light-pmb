'use strict';

const errUtil = {

  anyValue: "'STRING', 'NUMBER', 'NULL', 'TRUE', 'FALSE', '{', '['",

  unexpect(want, got) {
    return ('Invalid JSON: expected ' + want
      + ' but got unexpected token ' + got);
  },

};

module.exports = errUtil;
