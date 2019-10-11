import {PropDesc, PropGroupDesc} from '../block/Descriptor';
import {Block} from '../block/Block';
import {deepClone} from '../util/Clone';
import {endsWithNumberReg} from '../util/String';
import {hideGroupProperties, hideProperties, showGroupProperties, showProperties} from './PropertyShowHide';

export function addMoreProperty(block: Block, desc: PropDesc | PropGroupDesc, group?: string) {
  let propDesc: PropDesc;
  let groupDesc: PropGroupDesc;
  if (desc.type === 'group') {
    groupDesc = desc as PropGroupDesc;
    if (!Array.isArray(groupDesc.properties)) {
      groupDesc.properties = [];
    }
    if (groupDesc.defaultLen == null || !(groupDesc.defaultLen >= 0)) {
      groupDesc.defaultLen = 2;
    }
    group = groupDesc.name;
  } else {
    propDesc = desc as PropDesc;
    if (group == null) {
      if (!desc.name) {
        return; // not allow empty property unless it's in a group
      }
    } else if (desc.name.match(endsWithNumberReg)) {
      return; // group property should not end with number
    }
  }

  let moreProps = block.getValue('#more');

  if (!Array.isArray(moreProps)) {
    // if it's not a child property in a group
    if (groupDesc) {
      block.setValue('#more', [desc]);
      showGroupProperties(block, groupDesc);
    } else if (group == null) {
      block.setValue('#more', [desc]);
      if ((desc as PropDesc).visible !== 'low') {
        showProperties(block, [desc.name]);
      }
    }
    return;
  }

  moreProps = deepClone(moreProps);

  if (group != null) {
    let groupIdx = moreProps.findIndex((g: PropGroupDesc) => g.name === group);
    if (groupIdx > -1) {
      if (groupDesc) {
        hideGroupProperties(block, moreProps[groupIdx]);
        // replace existing group
        moreProps[groupIdx] = groupDesc;
        block.setValue('#more', moreProps);
        showGroupProperties(block, groupDesc);
      } else {
        // add property to existing group
        groupDesc = moreProps[groupIdx];
        let groupChildIdx = groupDesc.properties.findIndex((p: PropDesc) => p.name === propDesc.name);
        if (groupChildIdx > -1) {
          groupDesc.properties[groupChildIdx] = propDesc;
        } else {
          groupDesc.properties.push(propDesc);
          if (propDesc.visible !== 'low') {
            showGroupProperties(block, groupDesc, propDesc.name);
          }
        }
        block.setValue('#more', moreProps);
      }
    } else if (groupDesc) {
      // add a new group
      moreProps.push(groupDesc);
      block.setValue('#more', moreProps);
      showGroupProperties(block, groupDesc);
    }
  } else {
    let propIndex = moreProps.findIndex((g: PropDesc) => g.name === propDesc.name);
    if (propIndex > -1) {
      moreProps[propIndex] = propDesc;
    } else {
      moreProps.push(propDesc);
      if ((desc as PropDesc).visible !== 'low') {
        showProperties(block, [desc.name]);
      }
    }
    block.setValue('#more', moreProps);
  }
}

export function removeMoreProperty(block: Block, name: string, group?: string) {
  let moreProps: any[] = block.getValue('#more');

  if (!Array.isArray(moreProps)) {
    return;
  }

  moreProps = deepClone(moreProps);
  if (group) {
    let groupIdx = moreProps.findIndex((g: PropGroupDesc) => g.name === group && g.type === 'group');
    if (groupIdx > -1) {
      let groupDesc: PropGroupDesc = moreProps[groupIdx];
      if (name) {
        let groupChildIdx = groupDesc.properties.findIndex((p: PropDesc) => p.name === name);
        if (groupChildIdx > -1) {
          groupDesc.properties.splice(groupChildIdx, 1);
          block.setValue('#more', moreProps);
          hideGroupProperties(block, groupDesc, name);
        }
      } else {
        moreProps.splice(groupIdx, 1);
        block.setValue('#more', moreProps);
        hideGroupProperties(block, groupDesc);
      }
    }
  } else if (name) {
    let propIndex = moreProps.findIndex((g: PropDesc) => g.name === name);
    if (propIndex > -1) {
      moreProps.splice(propIndex, 1);
      block.setValue('#more', moreProps);
      hideProperties(block, [name]);
    }
  }
}

export function moveMoreProperty(block: Block, nameFrom: string, nameTo: string, group?: string) {
  if (nameFrom === nameTo) {
    return;
  }

  let moreProps: any[] = block.getValue('#more');
  if (!Array.isArray(moreProps)) {
    return;
  }
  moreProps = deepClone(moreProps);

  let targetProps = moreProps;
  if (group != null) {
    let foundGroup: PropGroupDesc = moreProps.find((g: PropGroupDesc) => g.name === group && g.type === 'group');
    if (foundGroup) {
      targetProps = foundGroup.properties;
    } else {
      return;
    }
  }

  let idxFrom = targetProps.findIndex((p: PropDesc | PropGroupDesc) => p.name === nameFrom);
  let idxTo = targetProps.findIndex((p: PropDesc | PropGroupDesc) => p.name === nameTo);
  if (idxFrom > -1 && idxTo > -1) {
    let from = targetProps.splice(idxFrom, 1)[0];
    targetProps.splice(idxTo, 0, from);
    block.setValue('#more', moreProps);
  }
}
