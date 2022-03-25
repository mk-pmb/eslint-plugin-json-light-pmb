'use strict';

const jsonlint = require('jsonlint-mod');

const ParseError = require('./utils/ParseError.js');

const fileContentsByPath = new Map();

function optimizeValidJsonErrorMessage(hash) {
  let msg = hash.message;
  if (msg) { return msg; }
  msg = 'got unexpected token ' + hash.token;
  let { expected } = hash;
  if (expected) {
    if (expected.join) { expected = expected.join(', '); }
    if (expected) { msg = `expected ${expected} but ` + msg; }
  }
  return msg;
}

function verifyValidJSON(source) {
  const errors = [];
  try {
    jsonlint.parser.yy.parseError = (msg, hash) => {
      throw new ParseError(msg, hash);
    };
    jsonlint.parse(source);
  } catch (e) {
    const { hash } = e;
    const loc = (hash.loc || false);
    errors.push({
      ruleId: 'valid-json',
      severity: 2,
      message: 'Invalid JSON: ' + optimizeValidJsonErrorMessage(hash),
      line: ([
        loc.first_line,
        hash.line,
      ].find(Number.isFinite) || 0),
      column: ([
        loc.first_column,
        hash.column,
        hash.col,
      ].find(Number.isFinite) || 0),
    });
  }
  return errors;
};

module.exports = {
  processors: {
    '.json': {
      preprocess(source, filePath) {
        fileContentsByPath.set(filePath, source);
        return [source];
      },
      postprocess: (foo, filePath) => {
        const source = fileContentsByPath.get(filePath);
        const errors = verifyValidJSON(source);
        fileContentsByPath.delete(filePath);

        return errors.map(e => Object.assign(e, {
          source: filePath,
        }));
      },
    },
  },
  configs: {
    recommended: {
      plugins: [
        'json-light',
      ],
    },
  },
};
