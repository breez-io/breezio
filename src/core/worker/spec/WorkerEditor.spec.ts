import {assert} from 'chai';
import {Job, Root} from '../../block/Block';
import {WorkerEditor} from '../WorkerEditor';
import {VoidListeners} from '../../block/spec/TestFunction';
import {WorkerFunction} from '../WorkerFunction';
import {Functions} from '../../block/Functions';
import {PropDesc, PropGroupDesc} from '../../block/Descriptor';
import {DataMap} from '../../util/DataTypes';

describe('WorkerEditor', function() {
  it('delete editor after unwatch', function() {
    let job = new Job();
    let editor1 = WorkerEditor.create(job, '#edit-1', {});
    let editor2 = WorkerEditor.create(job, '#edit-2');

    assert.isNull(editor2, 'failed to load');
    assert.instanceOf(job.getValue('#edit-2'), WorkerEditor);

    editor1.watch(VoidListeners);
    assert.equal(job.getValue('#edit-1'), editor1);

    // value deleted after unwatch
    editor1.unwatch(VoidListeners);
    assert.isUndefined(job.getValue('#edit-1'));
  });

  it('createFromField', function() {
    let job = new Job();
    let block = job.createBlock('a');
    let data = {
      '#is': '',
      'add': {
        '#is': 'add'
      }
    };

    WorkerFunction.registerType(data, {name: 'func1'}, 'WorkerEditor');

    // editor with map data
    block.setValue('use1', data);
    WorkerEditor.createFromField(block, '#edit-use1', 'use1');
    assert.deepEqual(block.getValue('#edit-use1').save(), data);

    // editor with registered worker function
    block.setValue('use2', 'WorkerEditor:func1');
    WorkerEditor.createFromField(block, '#edit-use2', 'use2');
    assert.deepEqual(block.getValue('#edit-use2').save(), data);

    Functions.clear('WorkerEditor:func1');
  });

  it('createFromFunction', function() {
    let job = new Job();
    let data = {
      '#is': '',
      'add': {
        '#is': 'subtract'
      }
    };

    WorkerFunction.registerType(data, {name: 'worker2'}, 'WorkerEditor');

    WorkerEditor.createFromFunction(job, '#edit-func', 'WorkerEditor:worker2', null);
    assert.deepEqual(job.getValue('#edit-func').save(), data);

    WorkerEditor.createFromFunction(job, '#edit-func', 'WorkerEditor:worker2-2', data);
    assert.deepEqual(job.getValue('#edit-func').save(), data);

    Functions.clear('WorkerEditor:worker2');
  });

  it('applyChange', function() {
    let job = new Job();
    let editor = WorkerEditor.create(job, '#edit-v2', {}, null, false, (data: DataMap) => {
      job.setValue('v2', data);
      return true;
    });
    editor.applyChange();
    assert.deepEqual(job.getValue('v2'), {'#is': ''});
  });

  it('applyChange function', function() {
    let job = new Job();

    let expectedData = {
      '#inputs': {
        '#is': '',
        '#custom': [
          {
            name: 'g',
            type: 'group',
            defaultLen: 2,
            properties: [{name: 'a', type: 'number'}]
          },
          {name: 'a', type: 'number'}
        ],
        '@b-p': ['a']
      },
      '#is': '',
      '#outputs': {
        '#is': '',
        '#custom': [
          {
            name: 'g',
            type: 'group',
            defaultLen: 2,
            properties: [{name: 'b', type: 'number'}]
          },
          {name: 'b', type: 'number'}
        ],
        '@b-p': ['b']
      },
      '#desc': {icon: 'fas:plus'}
    };
    let expectedDescProperties: (PropDesc | PropGroupDesc)[] = [
      {
        name: 'g',
        type: 'group',
        defaultLen: 2,
        properties: [
          {name: 'a', type: 'number'},
          {name: 'b', type: 'number', readonly: true}
        ]
      },
      {name: 'a', type: 'number'},
      {name: 'b', type: 'number', readonly: true}
    ];

    WorkerFunction.registerType({'#is': ''}, {name: 'worker3', properties: []}, 'WorkerEditor');

    let editor = WorkerEditor.createFromFunction(job, '#edit-func', 'WorkerEditor:worker3', null);
    editor.createBlock('#inputs')._load(expectedData['#inputs']);
    editor.createBlock('#outputs')._load(expectedData['#outputs']);
    editor.setValue('#desc', expectedData['#desc']);
    editor.applyChangeToFunc('WorkerEditor:worker3');

    assert.deepEqual(Functions.getWorkerData('WorkerEditor:worker3'), expectedData);

    let desc = Functions.getDescToSend('WorkerEditor:worker3')[0];
    assert.equal(desc.icon, 'fas:plus');
    assert.deepEqual(desc.properties, expectedDescProperties);

    Functions.clear('WorkerEditor:worker3');
  });
});
