import React, {CSSProperties, KeyboardEvent, WheelEvent} from "react";
import {ClientConnection} from "../../core/connect/ClientConnection";
import {DataMap} from "../../core/util/Types";
import {BlockView} from "./Block";
import {WireItem, WireView} from "./Wire";
import {DragDropDiv, DragState} from "rc-dock";
import {cssNumber} from "../../ui/util/Types";
import {BlockItem, FieldItem, Stage} from "./Field";
import {forAllPathsBetween} from "../../core/util/Path";
import {onDragBlockOver, onDropBlock} from "./DragDropBlock";
import ResizeObserver from 'resize-observer-polyfill';
import {BlockStageBase} from "./BlockStageBase";

interface Props {
  conn: ClientConnection;
  basePath: string;
  style?: React.CSSProperties;
  onSelect?: (keys: string[]) => void;
}

interface State {
  zoom: number;
}

const zoomScales = [0.25, 1 / 3, 0.5, 2 / 3, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4];

function getScale(zoom: number) {
  if (zoom >= 0 && zoom < zoomScales.length) {
    return zoomScales[zoom];
  }
  return 1;
}

export class BlockStage extends BlockStageBase {

  private _rootNode!: HTMLElement;
  private getRootRef = (node: HTMLDivElement): void => {
    this._rootNode = node;
  };

  private _mainLayer!: HTMLElement;
  private getMainLayerRef = (node: HTMLDivElement): void => {
    this._mainLayer = node;
  };

  private _bgNode!: HTMLElement;
  private getBgRef = (node: HTMLDivElement): void => {
    this._bgNode = node;
  };

  getRefElement() {
    return this._bgNode;
  }

  private _selectRectNode!: HTMLElement;
  private getSelectRectRef = (node: HTMLDivElement): void => {
    this._selectRectNode = node;
  };


  constructor(props: Props) {
    super(props);
    this.state = {zoom: zoomScales.indexOf(1)};
  }

  resizeObserver: any;

  componentDidMount() {
    this._mainLayer.addEventListener('scroll', this.handleScroll, {
      passive: true,
    });

    this.resizeObserver = new ResizeObserver(this.handleResize);
    this.resizeObserver.observe(this._rootNode);
  }

  onSelectRectDragStart = (e: DragState) => {
    let rect = this._bgNode.getBoundingClientRect();
    this._dragingSelect = [(e.clientX - rect.left) * e.component.scaleX, (e.clientY - rect.top) * e.component.scaleY];
    e.startDrag(null, null);
    this._selectRectNode.style.display = 'block';
  };

  onDragSelectMove = (e: DragState) => {
    let [x1, y1] = this._dragingSelect;
    let x2 = e.dx + x1;
    let y2 = e.dy + y1;
    this._selectRectNode.style.left = `${cssNumber(Math.min(x1, x2))}px`;
    this._selectRectNode.style.width = `${cssNumber(Math.abs(x1 - x2))}px`;
    this._selectRectNode.style.top = `${cssNumber(Math.min(y1, y2))}px`;
    this._selectRectNode.style.height = `${cssNumber(Math.abs(y1 - y2))}px`;
  };
  onDragSelectEnd = (e: DragState) => {
    if (e) {
      // if e==null, then the dragging is canceled
      let [x1, y1] = this._dragingSelect;
      let x2 = e.dx + x1;
      let y2 = e.dy + y1;
      let left = Math.min(x1, x2) - 1;
      let right = Math.max(x1, x2) + 1;
      let top = Math.min(y1, y2) - 1;
      let bottom = Math.max(y1, y2) + 1;
      let addToSelect = e.event.shiftKey || e.event.ctrlKey;
      for (let [blockKey, blockItem] of this._blocks) {
        if (blockItem.x >= left && blockItem.w + blockItem.x <= right
          && blockItem.y >= top && blockItem.y + 24 <= bottom) {
          blockItem.setSelected(true);
        } else if (blockItem.selected && !addToSelect) {
          blockItem.setSelected(false);
        }
      }
      this.onSelect();
    }

    this._selectRectNode.style.display = null;
    this._selectRectNode.style.width = '0';
    this._dragingSelect = null;
  };

  onDragOver = (e: DragState) => {
    let {conn} = this.props;
    onDragBlockOver(conn, e);
  };

  onDrop = (e: DragState) => {
    let {conn} = this.props;
    onDropBlock(conn, e, this.createBlock, this._bgNode);
  };

  handleResize = () => {

  };
  handleScroll = (event: UIEvent) => {
    const offset = this._mainLayer.scrollTop;

  };

  onWheel = (e: WheelEvent) => {
    if (e.altKey) {
      let {zoom} = this.state;
      if (e.deltaY < 0 && zoom < zoomScales.length - 1) {
        this.setState({zoom: zoom + 1});
      } else if (e.deltaY > 0 && zoom > 0) {
        this.setState({zoom: zoom - 1});
      }
      e.stopPropagation();
    }
  };

  render() {
    let {style} = this.props;
    let {zoom} = this.state;

    let mainLayerStyle: CSSProperties = {};
    let zoomScale = getScale(zoom);
    if (zoomScale !== 1) {
      mainLayerStyle.transform = `scale(${zoomScale},${zoomScale})`;
      mainLayerStyle.width = `${100 / zoomScale}%`;
      mainLayerStyle.height = `${100 / zoomScale}%`;
    }

    let children: React.ReactNode[] = [];

    // add wires
    for (let [key, fieldItem] of this._fields) {
      if (fieldItem.inWire) {
        children.push(<WireView key={`~${key}`} item={fieldItem.inWire}/>);
      }
    }
    // add blocks
    for (let [key, blockItem] of this._blocks) {
      children.push(<BlockView key={key} item={blockItem}/>);
    }

    return (
      <div style={style} className="ticl-block-stage" ref={this.getRootRef} onKeyDown={this.onKeyDown} tabIndex={0}
           onWheel={this.onWheel}>
        <DragDropDiv className="ticl-block-stage-main" getRef={this.getMainLayerRef} onDragOverT={this.onDragOver}
                     onDropT={this.onDrop}
                     style={mainLayerStyle}>
          <DragDropDiv className='ticl-block-stage-bg' getRef={this.getBgRef} directDragT={true}
                       onDragStartT={this.onSelectRectDragStart} onDragMoveT={this.onDragSelectMove}
                       onDragEndT={this.onDragSelectEnd}/>
          {children}
          <div ref={this.getSelectRectRef} className="ticl-block-select-rect"/>
        </DragDropDiv>
      </div>
    );
  }

  onKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'Delete': {
        this.deleteSelectedBlocks();
        return;
      }
    }
  };

  componentWillUnmount() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    super.componentWillUnmount();
  }

}
