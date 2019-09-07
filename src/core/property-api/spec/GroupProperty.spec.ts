import {assert} from "chai";

import {Block, Job} from "../../block/Block";
import "../../functions/basic/Math";
import {insertGroupProperty, moveGroupProperty, removeGroupProperty, setGroupLength} from "../GroupProperty";

describe("GroupProperty", function () {

  it('setGroupLength', function () {
    let job = new Job();
    job.load({
      '#is': 'add'
    });

    setGroupLength(job, '', 3);
    assert.deepEqual(job.getValue('#len'), 3);
    assert.deepEqual(job.getValue('@b-p'), ['2']);

    setGroupLength(job, '', 0);
    assert.isUndefined(job.getValue('@b-p'));

    setGroupLength(job, '', 3);
    assert.deepEqual(job.getValue('@b-p'), ['0', '1', '2']);

    // set -1 will use default length
    setGroupLength(job, '', -1);
    assert.deepEqual(job.getValue('@b-p'), ['0', '1']);

    // invalid group, length should change but nothing else should happen
    setGroupLength(job, 'aa', 3);
    assert.deepEqual(job.getValue('aa#len'), 3);
    assert.deepEqual(job.getValue('@b-p'), ['0', '1']);
  });

  it('setGroupLength on #more', function () {
    let job = new Job();
    job.load({
      '#is': '',
      '#more': [
        {name: 'g', type: 'group', defaultLen: 2, properties: [{name: 'a', type: 'number'}]},
      ]
    });

    setGroupLength(job, 'g', 3);
    assert.deepEqual(job.getValue('g#len'), 3);
    assert.deepEqual(job.getValue('@b-p'), ['a2']);
  });

  it('insertGroupProperty', function () {
    let job = new Job();
    job.load({
      '#is': 'add',
      '0': 0,
      '1': 1
    });

    insertGroupProperty(job, '', 0);
    assert.equal(job.getValue('#len'), 3);
    assert.equal(job.getValue('1'), 0);

    insertGroupProperty(job, '', 3);
    assert.equal(job.getValue('#len'), 4);

    // invalid index, no change
    insertGroupProperty(job, '', -1);
    insertGroupProperty(job, '', 100);
    assert.equal(job.getValue('#len'), 4);
  });

  it('removeGroupProperty', function () {
    let job = new Job();
    job.load({
      '#is': 'add',
      '0': 0,
      '1': 1
    });

    removeGroupProperty(job, '', 0);
    assert.equal(job.getValue('#len'), 1);
    assert.equal(job.getValue('0'), 1);

    // invalid index, no change
    removeGroupProperty(job, '', -1);
    removeGroupProperty(job, '', 100);
    assert.equal(job.getValue('#len'), 1);
  });

  it('moveGroupProperty', function () {
    let job = new Job();
    job.load({
      '#is': 'add',
      '0': 0,
      '1': 1
    });

    moveGroupProperty(job, '', 0, 1);
    assert.equal(job.getValue('0'), 1);
    assert.equal(job.getValue('1'), 0);

    moveGroupProperty(job, '', 1, 0);
    assert.equal(job.getValue('0'), 0);
    assert.equal(job.getValue('1'), 1);

    // invalid index, no change
    moveGroupProperty(job, '', 1, 100);
    moveGroupProperty(job, '', 100, 0);
    assert.equal(job.getValue('0'), 0);
    assert.equal(job.getValue('1'), 1);
  });
});
