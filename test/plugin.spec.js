'use strict';
/* eslint-env mocha */

const { expect } = require('chai');

const plugin = require('../lib/index.js');
const { anyValue, unexpect } = require('./errUtil.js');

const jsonProc = plugin.processors['.json'];
const dummyPath = '/some/path/to/some.json';


const fixtures = {
  valid: [
    {
      code: `
{
    "a": "value",
    "b": 2
}
      `,
      options: [],
    },
    {
      code: `
{}
      `,
      options: [],
    },
  ],
  invalid: [
    {
      code:
`{
  "a": "value",
  "b": "value",
}`,
      options: [],
      errors: [
        {
          message: unexpect("'STRING'", '}'),
          line: 3,
          column: 14,
        },
      ],
    },
    {
      code:
`

`,
      options: [],
      errors: [
        {
          message: unexpect(anyValue, 'EOF'),
          line: 1,
          column: 0,
        },
      ],
    },
    {
      code: '{',
      errors: [
        {
          message: unexpect("'STRING', '}'", 'EOF'),
          line: 1,
          column: 0,
        },
      ],
    },
    // parser must return a plain object
    {
      code: `
/*"SOME_VALID_JSON"*/
      `,
      options: [],
      errors: [
        {
          message: unexpect(anyValue, 'INVALID'),
          line: 1,
          column: 0,
        },
      ],
    },
  ],
};

describe('Plugin', () => {
  describe('valid JSON', () => {
    fixtures.valid.forEach((obj) => {
      it('should pass', () => {
        const preprocesssResult = jsonProc.preprocess(obj.code, dummyPath);
        expect(preprocesssResult).to.be.an('array');
        const result = jsonProc.postprocess('foo', dummyPath);
        expect(result).to.be.eql([]);
      });
    });
  });
  describe('invalid JSON', () => {
    fixtures.invalid.forEach((obj) => {
      it('should fail', () => {
        jsonProc.preprocess(obj.code, dummyPath);
        const result = jsonProc.postprocess('foo', dummyPath);
        expect(result[0].message).to.be.equal(obj.errors[0].message);
        expect(result[0].line).to.be.equal(obj.errors[0].line);
        expect(result[0].column).to.be.equal(obj.errors[0].column);
      });
    });
  });
});
