import {assert} from "chai";
import {Job} from "../Job";
import {Block} from "../Block";

describe("Block", () => {

  it('basic', () => {
    let job = new Job();
    job.setValue('@a', 357);
    job.setBinding('@b', '@a');
    assert.equal(job.getValue('@b'), 357, 'basic binding');

    let block = job.createBlock('obj');
    assert.equal(block instanceof Block, true, 'createBlock');
    assert.equal(block, job.getValue('obj'), 'get child block');


    block.setValue('@c', 468);
    job.setBinding('@d', 'obj.@c');
    assert.equal(job.getValue('@d'), 468, 'path binding');

    block.setBinding('@e', '##.@b');
    assert.equal(block.getValue('@e'), 357, 'parent binding');

    block.setBinding('@f', '###.@a');
    assert.equal(block.getValue('@f'), 357, 'job binding');

    job.setBinding('@d', null);
    assert.equal(job.getValue('@d'), null, 'clear binding');
  });

  it('query property', () => {
    let job = new Job();
    let block1 = job.createBlock('block1');
    let block2 = block1.createBlock('block2');
    block2.setValue('p1', 1);

    assert.isTrue(job.queryProperty('block3.p2', true) == null, 'query on non-exist block');
    assert.equal(job.queryProperty('block1.block2.p1').getValue(), 1, 'query on existing property');
    assert.isTrue(job.queryProperty('block1.block2.p2') == null, 'query on non-exist property');
    assert.isTrue(job.queryProperty('block1.block2.p3', true) != null, 'query and create property');

    assert.equal(job.queryProperty('block1.block2.#').getValue(), block2, 'query self');
    assert.equal(job.queryProperty('block1.block2.##').getValue(), block1, 'query parent');
    assert.equal(job.queryProperty('block1.block2.###').getValue(), job, 'query job');
  });

  it('destroy binding chain', () => {
    let job = new Job();
    let block1 = job.createBlock('block1');
    let block1c = block1.createOutputBlock('c');
    let block2 = job.createBlock('block2');
    block2.setBinding('c', '##.block1.c');

    assert.equal(block2.getValue('c'), block1c, 'setup binding chain');

    job.updateValue('block1', undefined);

    assert.equal(block2.getValue('c'), undefined, 'destroy binding chain');
  });

});
