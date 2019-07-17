import {assert} from "chai";
import {smartStrCompare} from '../String';

describe("String", function () {

  it('smartStrCompare', () => {

    assert.equal(('3,1,2'.split(',').sort(smartStrCompare)).join(','),
      '1,2,3');

    // test number
    assert.equal(
      ('a123,a13,b12,b8,a4,a55,c1'.split(',')
        .sort(smartStrCompare)).join(','),
      'a4,a13,a55,a123,b8,b12,c1');

    // test sign
    assert.equal(
      ('a+123,a+13,a+4,a-123,a-13,a-4,a0'.split(',')
        .sort(smartStrCompare)).join(','),
      'a-123,a-13,a-4,a0,a+4,a+13,a+123');

    // test upper lower case
    assert.equal(
      ('aAA,AaA,aCa,AAa,aAa,AAB'.split(',')
        .sort(smartStrCompare)).join(','),
      'AAa,AaA,aAA,aAa,AAB,aCa');
  });

});