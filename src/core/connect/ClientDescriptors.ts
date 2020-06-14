import {FunctionDesc} from '../block/Descriptor';

export const clientDescriptors: FunctionDesc[] = [
  {
    priority: 0,
    name: 'inputs',
    id: 'flow:inputs',
    icon: 'fas:arrow-circle-down',
    color: '9bd',
    properties: [],
    configs: ['#value'],
  },
  {
    priority: 0,
    name: 'outputs',
    id: 'flow:outputs',
    icon: 'fas:arrow-circle-up',
    color: '9bd',
    properties: [],
    configs: ['#value', '#wait(#outputs)'],
  },
  {
    priority: 0,
    name: 'main',
    id: 'flow:main',
    properties: [],
    icon: 'fas:file',
    color: '4af',
    src: 'hidden',
    ns: 'flow',
    configs: ['#disabled'],
  },
  {
    priority: 0,
    name: 'const',
    id: 'flow:const',
    properties: [],
    icon: 'fas:file',
    color: '4af',
    src: 'hidden',
    ns: 'flow',
    configs: [],
  },
  {
    priority: 0,
    name: 'worker',
    id: 'flow:worker',
    properties: [],
    icon: 'fas:file',
    color: '9bd',
    src: 'hidden',
    ns: 'flow',
    configs: ['#desc', '#disabled'],
  },
  {
    priority: 0,
    name: 'editor',
    id: 'flow:editor',
    properties: [],
    icon: 'fas:file',
    color: '9bd',
    src: 'hidden',
    ns: 'flow',
    configs: ['#desc', '#disabled'],
  },
  {
    priority: 0,
    name: 'shared',
    id: 'flow:shared',
    properties: [],
    icon: 'fas:file',
    color: '4af',
    src: 'hidden',
    ns: 'flow',
    configs: ['#cacheMode', '#disabled'],
  },
];
