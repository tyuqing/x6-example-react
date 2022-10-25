export const GROUP_ATTRS = {
  circle: {
    r: 4,
    magnet: true,
    stroke: '#5F95FF',
    strokeWidth: 1,
    fill: '#fff',
    style: {
      visibility: 'hidden',
    },
  },
};
export const DEFAULT_PORTS_ITEMS = [
  {
    group: 'top',
  },
  {
    group: 'right',
  },
  {
    group: 'bottom',
  },
  {
    group: 'left',
  },
];
// 链接桩
export const DEFAULT_PORTS = {
  groups: {
    top: {
      position: 'top',
      attrs: GROUP_ATTRS,
    },
    right: {
      position: 'right',
      attrs: GROUP_ATTRS,
    },
    bottom: {
      position: 'bottom',
      attrs: GROUP_ATTRS,
    },
    left: {
      position: 'left',
      attrs: GROUP_ATTRS,
    },
  },
  items: DEFAULT_PORTS_ITEMS,
};
// 节点大小
export const NODE_WIDTH = 150;
export const NODE_HEIGHT = 36;

// TODO 画布大小指定
export const LAYOUT_WIDTH = 738;
export const LAYOUT_HEIGHT = 360;

let CANVAS_SCALE_TOOLBAR_CONFIG = {
  ZOOM_IN: 'xflow:graph-zoom-zoom-in',
  ZOOM_OUT: 'xflow:graph-zoom-zoom-out',
  SCALE_TO_ONE: 'xflow:graph-zoom-scale-to-one',
  SCALE_TO_FIT: 'xflow:graph-zoom-scale-to-fit',
  FULLSCREEN: 'xflow:graph-zoom-fullscreen',
  MAX_SCALE: 1.5,
  MIN_SCALE: 0.05,
};
CANVAS_SCALE_TOOLBAR_CONFIG.zoomOptions = {
  maxScale: CANVAS_SCALE_TOOLBAR_CONFIG.MAX_SCALE,
  minScale: CANVAS_SCALE_TOOLBAR_CONFIG.MIN_SCALE,
};
export { CANVAS_SCALE_TOOLBAR_CONFIG };

export const XFlowGraphCommands = {
  GRAPH_ZOOM: {
    id: 'xflow:graph-zoom',
    label: '缩放画布',
  },
  GRAPH_FULLSCREEN: {
    id: 'xflow:graph-fullscreen',
    label: '全屏',
  },
};
