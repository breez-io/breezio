import {FunctionDesc} from '../block/Descriptor';

export const clientDescriptors: FunctionDesc[] = [
  {
    priority: 0,
    name: 'inputs',
    id: 'job:inputs',
    icon: 'fas:arrow-circle-down',
    color: 'e91',
    properties: [],
    configs: ['#value']
  },
  {
    priority: 0,
    name: 'outputs',
    id: 'job:outputs',
    icon: 'fas:arrow-circle-up',
    color: 'e91',
    properties: [],
    configs: ['#value', '#wait(#outputs)']
  },
  {
    priority: 0,
    name: 'main',
    id: 'job:main',
    properties: [],
    icon: 'fas:file',
    color: 'e91',
    src: 'hidden',
    ns: 'job',
    configs: []
  },
  {
    priority: 0,
    name: 'const',
    id: 'job:const',
    properties: [],
    icon: 'fas:file',
    color: 'e91',
    src: 'hidden',
    ns: 'job',
    configs: []
  },
  {
    priority: 0,
    name: 'worker',
    id: 'job:worker',
    properties: [],
    icon: 'fas:file',
    color: 'e91',
    src: 'hidden',
    ns: 'job',
    configs: ['#desc']
  },
  {
    priority: 0,
    name: 'editor',
    id: 'job:editor',
    properties: [],
    icon: 'fas:file',
    color: 'e91',
    src: 'hidden',
    ns: 'job',
    configs: ['#desc']
  },
  {
    priority: 0,
    name: 'shared',
    id: 'job:shared',
    properties: [],
    icon: 'fas:file',
    color: 'e91',
    src: 'hidden',
    ns: 'job',
    configs: []
  }
];
