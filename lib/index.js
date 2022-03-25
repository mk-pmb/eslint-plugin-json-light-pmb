'use strict';

const jsonlint = require('jsonlint-mod');
const unbom = require('unbom');
const univeil = require('univeil');

const ParseError = require('./utils/ParseError.js');

const fileContentsByPath = new Map();

function generateErrorMessage(hash) {
  let msg = ('got unexpected token '
    + (hash.token || '<?? no token reported ??>'));
  let { expected } = hash;
  if (expected) {
    if (expected.join) { expected = expected.join(', '); }
    if (expected) { msg = `expected ${expected} but ` + msg; }
  }
  return msg;
}

function explainErrorMessage(msg) {
  if (msg === "unexpected '\uFEFF'") { return 'unexpected UTF-8 BOM'; }
}


function verifyValidJSON(source) {
  try {
    jsonlint.parser.yy.parseError = (msg, hash) => {
      throw new ParseError(msg, hash);
    };
    jsonlint.parse(source);
  } catch (e) {
    const { hash } = e;
    const loc = (hash.loc || false);

    let msg = (hash.message || generateErrorMessage(hash));
    msg = (explainErrorMessage(msg) || msg);
    msg = univeil(msg);

    const firstError = {
      ruleId: 'valid-json',
      severity: 2,
      message: 'Invalid JSON: ' + msg,
      line: ([
        loc.first_line,
        hash.line,
      ].find(Number.isFinite) || 0),
      column: ([
        loc.first_column,
        hash.column,
        hash.col,
      ].find(Number.isFinite) || 0),
    };
    return [firstError];
  }
  return []; // no errors
};

module.exports = {
  processors: {
    '.json': {
      preprocess(source, filePath) {
        const json = unbom(source);
        // ^-- Caring about BOM can be left to eslint rule `unicode-bom`.
        fileContentsByPath.set(filePath, json);
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
