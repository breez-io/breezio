import React from 'react';
import {LazyUpdateComponent, LazyUpdateSubscriber} from '../../ui/component/LazyUpdateComponent';
import {ClientConn} from '../../core/connect/ClientConn';
import {TRUNCATED} from '../../core/util/DataTypes';
import {encodeDisplay} from '../../core/util/Serialize';
import {displayNumber} from '../../ui/util/Types';
import {Popup} from '../component/ClickPopup';
import {ObjectTree} from '../object-tree/ObjectTree';
import {ObjectTreePanel} from '../../panel/object-tree/ObjectTreePanel';
import {TicloLayoutContext, TicloLayoutContextType} from '../component/LayoutContext';
import {renderValue} from '../component/renderValue';

interface Props {
  conn: ClientConn;
  path: string;
}

export class FieldValue extends LazyUpdateComponent<Props, any> {
  static contextType = TicloLayoutContextType;
  context!: TicloLayoutContext;

  valueSub = new LazyUpdateSubscriber(this);

  constructor(props: Props) {
    super(props);
    let {conn, path} = props;
    this.valueSub.subscribe(conn, path, false);
  }
  getObjectMenu = () => {
    let {conn, path} = this.props;
    let val = this.valueSub.value;
    return <ObjectTree conn={conn} path={path} data={val} />;
  };
  objectTreeShown = false;
  onExpandObjectTree = (e: React.MouseEvent) => {
    let {path} = this.props;
    let val = this.valueSub.value;
    this.context.showObjectTree(path, val, e.target as HTMLElement, this);
    this.objectTreeShown = true;
  };

  getObjectPopup = (val: any) => {
    if (this.context && this.context.showObjectTree) {
      return (
        // use float panel if possible
        <div className="ticl-tree-arr ticl-tree-arr-expand" onClick={this.onExpandObjectTree} />
      );
    }
    return (
      // show as popup menu
      <Popup
        popup={this.getObjectMenu}
        popupAlign={{
          points: ['tl', 'tr'],
          offset: [-6, 0]
        }}
      >
        <div className="ticl-tree-arr ticl-tree-arr-expand" />
      </Popup>
    );
  };

  renderImpl() {
    let child = renderValue(this.valueSub.value, this.getObjectPopup);
    return <div className="ticl-field-value">{child}</div>;
  }

  componentWillUnmount(): void {
    if (this.objectTreeShown && this.context && this.context.closeObjectTree) {
      let {path} = this.props;
      this.context.closeObjectTree(path, this);
    }
    this.valueSub.unsubscribe();
    super.componentWillUnmount();
  }
}
