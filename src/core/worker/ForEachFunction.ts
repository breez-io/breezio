import {Functions} from '../block/Functions';
import {BlockFunction, FunctionOutput} from '../block/BlockFunction';
import {BlockIO, BlockProperty} from '../block/BlockProperty';
import {Block, BlockChildWatch} from '../block/Block';
import {DataMap} from '../util/DataTypes';
import {Event, EventType} from '../block/Event';
import {MapImpl} from './MapImpl';
import {RepeaterWorker} from './JobWorker';
import {Resolver} from '../block/Resolver';

class ForEachOutput implements FunctionOutput {
  constructor(public func: ForEachFunction, public key: string) {}

  _overrideValue: any;
  _result: any = {};
  output(value: any, field?: string): void {
    if (field === '#value') {
      this._overrideValue = value;
    } else {
      this._result = {...this._result, [field]: value};
    }
    if (this._overrideValue === undefined) {
      // let ForEachFunction decide whether it uses spread operator to create new object
      this._result = this.func._output(this.key, this._result);
    } else {
      this.func._output(this.key, this._overrideValue);
    }
  }
}

export class ForEachFunction extends BlockFunction implements BlockChildWatch {
  _src: DataMap | string;
  _srcChanged: boolean = false;

  _applyWorkerChange!: (data: DataMap) => boolean;

  _input: any;
  _inputChanged: boolean = false;
  _watchedInputBlock: Block;

  _funcBlock: Block;

  _workers: Map<string, RepeaterWorker>;

  _outputCache: any;
  _currentOutput: any;

  static inputMap = new Map([
    ['input', ForEachFunction.prototype._onInputChange],
    ['use', MapImpl.prototype._onSourceChange],
  ]);
  getInputMap() {
    return ForEachFunction.inputMap;
  }

  _onInputChange(val: any): boolean {
    if (!Object.isExtensible(val)) {
      // validate the input
      val = null;
    }
    if (val !== this._input) {
      this._input = val;
      this._inputChanged = true;
      return true;
    }
    return false;
  }

  run(): any {
    if (!this._funcBlock) {
      this._funcBlock = this._data.createOutputBlock('#func');
    }
    if (this._srcChanged) {
      this._clearWorkers();
      this._srcChanged = false;
    } else if (!this._inputChanged) {
      this._checkChanges();
      this._applyPendingOutput();
      return;
    } else if (this._watchedInputBlock) {
      // since input block is changed
      this._clearWorkers();
    }
    if (this._src) {
      this._inputChanged = false;
      // watch input when input changed or use changed
      if (this._input && typeof this._input === 'object') {
        if (this._input instanceof Block) {
          this._watchBlock(this._input);
        } else {
          this._watchObject(this._input);
        }
        this._applyPendingOutput();
        return;
      }
    }
    // no input, delete output
    this._clearWorkers();
    this._deleteOutput();
  }

  onChildChange(property: BlockProperty, saved?: boolean) {
    this._childChanges.add(property._name);
    if (this._childChanges.size === 1) {
      // use _onCall so it triggers synchronously in sync mode
      this._data._onCall(new Event('childChanged'));
    }
  }

  _childChanges: Set<string> = new Set<string>();

  _checkChanges() {
    for (let key of this._childChanges) {
      let val = this._watchedInputBlock.getValue(key);
      if (val !== undefined) {
        if (this._workers.has(key)) {
          this._workers.get(key).updateInput(val);
        } else {
          this._addWorker(key, val);
        }
      } else {
        if (this._workers.has(key)) {
          this._removeWorker(key);
        }
      }
    }
    this._childChanges.clear();
  }

  // when input is regular Object
  _watchObject(obj: DataMap) {
    if (this._workers) {
      // update existing workers
      let oldWorkers = this._workers;
      this._workers = new Map();
      for (let key in obj) {
        let input = obj[key];
        if (input === undefined) {
          continue;
        }
        if (oldWorkers.has(key)) {
          oldWorkers.get(key).updateInput(input);
          this._workers.set(key, oldWorkers.get(key));
          // remove from oldWorkers so it won't be destroyed later
          oldWorkers.set(key, undefined);
        } else {
          this._addWorker(key, input);
        }
      }
      // destroy old workers
      for (let [key, oldWorker] of oldWorkers) {
        if (oldWorker) {
          oldWorker.destroy();
          this._funcBlock.deleteValue(key);
          this._output(key, undefined);
        }
      }
    } else {
      if (Array.isArray(obj)) {
        this._outputCache = new Array(obj.length);
        this._currentOutput = [];
      } else {
        this._outputCache = {};
        this._currentOutput = {};
      }
      this._workers = new Map();
      for (let key in obj) {
        this._addWorker(key, obj[key]);
      }
    }
  }

  // when input is Block
  _watchBlock(block: Block) {
    this._workers = new Map();
    this._outputCache = {};
    this._currentOutput = {};
    this._watchedInputBlock = block;
    block.forEach((field: string, prop: BlockIO) => {
      this._addWorker(field, prop._value);
    });
    block.watch(this);
  }

  _removeWorker(key: string) {
    this._funcBlock.deleteValue(key);
    this._output(key, undefined);
  }

  _addWorker(key: string, input: any) {
    let output = new ForEachOutput(this, key);
    let child = this._funcBlock.createOutputJob(RepeaterWorker, key, this._src, output, this._applyWorkerChange);
    this._workers.set(key, child);
    child.updateInput(input);
  }

  _pendingOutput = false;
  _output(key: string, value: any): any {
    if (value === this._currentOutput[key]) {
      if (value && value.constructor === Object) {
        value = {...value};
      } else {
        return value;
      }
    }
    if (value === undefined) {
      delete this._outputCache[key];
    } else {
      this._outputCache[key] = value;
    }
    this._applyOuputLater();
    return value;
  }
  _applyOuputLater() {
    if (!this._pendingOutput) {
      this._pendingOutput = true;
      Resolver.callLater(this._applyPendingOutput);
    }
  }
  _applyPendingOutput = () => {
    if (this._data && this._pendingOutput) {
      this._pendingOutput = false;

      this._currentOutput = this._outputCache;
      if (Array.isArray(this._input)) {
        this._outputCache = [...this._currentOutput];
      } else {
        this._outputCache = {...this._currentOutput};
      }
      this._data.output(this._currentOutput);
    }
  };

  _deleteOutput() {
    this._data.deleteValue('#output');
  }

  _clearWorkers() {
    if (this._workers) {
      for (let [key, worker] of this._workers) {
        this._removeWorker(key);
      }
      this._workers = null;
    }
    if (this._watchedInputBlock) {
      this._watchedInputBlock.unwatch(this);
      this._watchedInputBlock = null;
      this._childChanges.clear();
    }
    this._pendingOutput = false;
    this._currentOutput = null;
    this._outputCache = null;
  }

  cancel(reason: EventType = EventType.TRIGGER) {
    this._clearWorkers();
    return true;
  }

  cleanup(): void {
    this._data.deleteValue('#output');
    this._data.deleteValue('#func');
  }

  destroy(): void {
    this._funcBlock = null;
    if (this._watchedInputBlock) {
      this._watchedInputBlock.unwatch(this);
      this._watchedInputBlock = null;
    }
    super.destroy();
  }
}

ForEachFunction.prototype._applyWorkerChange = MapImpl.prototype._applyWorkerChange;

Functions.add(ForEachFunction, {
  name: 'foreach',
  priority: 1,
  properties: [
    {name: 'input', type: 'object'},
    {name: 'use', type: 'worker'},
    {name: '#output', type: 'any', readonly: true},
  ],
  category: 'repeat',
});
