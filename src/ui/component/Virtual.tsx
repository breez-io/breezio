import React from 'react';
import ResizeObserver from 'resize-observer-polyfill';
import {List, ListRowRenderer} from 'react-virtualized';

interface Props {
  itemCount: number;
  itemHeight: number;
  renderer: ListRowRenderer;
  className?: string;
  style?: React.CSSProperties;
}

interface State {
  width: number;
  height: number;
}

export default class VirtualList extends React.Component<Props, State> {
  static defaultProps = {};

  state = {width: 0, height: 0};
  resizeObserver: any;

  private rootNode!: HTMLElement;
  private getRef = (node: HTMLDivElement): void => {
    this.rootNode = node;
  };

  componentDidMount() {
    this.resizeObserver = new ResizeObserver((resizes: any) => {
      this.setState({
        height: this.rootNode.clientHeight,
        width: this.rootNode.clientWidth
      });
    });
    this.resizeObserver.observe(this.rootNode);
  }

  componentWillUnmount() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  render() {
    const {itemCount, itemHeight, renderer, className, style} = this.props;
    const {width, height} = this.state;
    const {padding, ...parentStyle} = style;

    return (
      <div ref={this.getRef} className={className} style={parentStyle}>
        <List
          className="ticl-v-scroll"
          width={width}
          height={height}
          rowCount={itemCount}
          rowHeight={itemHeight}
          rowRenderer={renderer}
          tabIndex={-1}
          style={{padding}}
        />
      </div>
    );
  }
}
