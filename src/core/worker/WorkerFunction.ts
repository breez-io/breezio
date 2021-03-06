import {Functions} from '../block/Functions';
import {BlockFunction} from '../block/BlockFunction';
import {FunctionDesc, PropDesc, PropGroupDesc} from '../block/Descriptor';
import {BlockIO} from '../block/BlockProperty';
import {Flow} from '../block/Flow';
import {DataMap} from '../util/DataTypes';
import {WorkerFlow} from './WorkerFlow';

export class WorkerFunction extends BlockFunction {
  readonly type: string;
  _namespace: string;
  _funcFlow: WorkerFlow;

  inputChanged(input: BlockIO, val: any): boolean {
    return false;
  }

  run(): any {
    let applyChange: (data: DataMap) => boolean;
    if (this._namespace === '') {
      applyChange = (data: DataMap) => {
        return WorkerFunction.applyChangeToFunc(this._funcFlow, null, data);
      };
    }
    this._funcFlow = this._data.createOutputFlow(WorkerFlow, '#func', this.type, this._data, applyChange);
    this._funcFlow.updateInput(this._data);
  }

  cleanup(): void {
    this._data.deleteValue('#func');
  }

  static registerType(data: DataMap, desc: FunctionDesc, namespace?: string) {
    class CustomWorkerFunction extends WorkerFunction {
      static ticlWorkerData = data;
    }

    if (!desc.priority) {
      desc.priority = 1;
    }
    desc.src = 'worker';

    CustomWorkerFunction.prototype._namespace = namespace;

    Functions.add(CustomWorkerFunction, desc, namespace);
  }

  /**
   * save the worker to a function
   */
  static applyChangeToFunc(flow: Flow, funcId: string, data?: DataMap) {
    if (!data) {
      data = flow.save();
    }
    if (!funcId) {
      funcId = flow._loadFrom;
    }
    if (!funcId) {
      return false;
    }
    let desc = WorkerFunction.collectDesc(funcId, data);
    if (funcId.startsWith(':')) {
      Functions.saveWorkerFunction(funcId, flow, data);
    }
    WorkerFunction.registerType(data, desc, flow._namespace);
    return true;
  }

  static collectDesc(funcId: string, data: DataMap): FunctionDesc {
    let name: string;
    let pos = funcId.indexOf(':');
    if (pos > -1) {
      name = funcId.substring(pos + 1);
    } else {
      return null;
    }
    let desc: FunctionDesc = {name, properties: WorkerFunction.collectProperties(data)};
    let savedDesc = data['#desc'] as FunctionDesc;
    if (savedDesc && typeof savedDesc === 'object' && savedDesc.constructor === Object) {
      desc = {...savedDesc, ...desc};
    }
    desc.id = funcId;
    return desc;
  }
  /**
   * collect function parameters for creating worker function
   */
  static collectProperties(data: DataMap) {
    let properties: (PropDesc | PropGroupDesc)[] = [];
    let groups: Map<string, PropGroupDesc> = new Map();
    // add inputs
    let inputs = data['#inputs']?.['#custom'];
    if (Array.isArray(inputs)) {
      for (let input of inputs) {
        let copyInput = {...input};
        // input should not be readonly
        delete copyInput.readonly;
        properties.push(copyInput);
        if (input.type === 'group') {
          groups.set(input.name, input);
        }
      }
    }
    // add outputs
    let outputs = data['#outputs']?.['#custom'];
    let mainOutput: PropDesc;
    if (Array.isArray(outputs)) {
      for (let output of outputs) {
        if (output.type === 'group' && groups.has(output.name)) {
          let groupProperties = groups.get(output.name).properties;
          // merge output group with input group
          for (let prop of output.properties) {
            groupProperties.push({...prop, readonly: true});
          }
        } else {
          if (output.name === '#output') {
            mainOutput = {...output, readonly: true};
          } else {
            properties.push({...output, readonly: true});
          }
        }
      }
    }
    if (mainOutput) {
      // #output must be the last property
      properties.push(mainOutput);
    }
    return properties;
  }
}
