import React, { useEffect, useCallback, useMemo } from 'react';
import { Graph, Addon } from '@antv/x6';
import { GridLayout } from '@antv/layout';
import {
  Col,
  Row,
  Space,
  Button,
  Tooltip,
  notification,
  Divider,
  Modal,
} from 'antd';
import { useRequest, useSetState, useUpdateEffect } from 'ahooks';
import '@antv/x6-react-shape';
import { isNumber, pick } from 'lodash';
import { ClearOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';

import { addPortEvent } from './event';
import DrawerOperation from './DrawerOperation/index';
// import { RESOURCE_TYPE_APPLICATION, RESOURCE_TYPE_RESOURCE } from '@/const/resource';
import ApplicationNode from './ApplicationNode/index';
import CanvasScaleToolbar from './CanvasScaleToolbar';

import styles from './index.less';
import { getTopologyDetail } from '@/services/topology';
import {
  DEFAULT_PORTS_ITEMS,
  DEFAULT_PORTS,
  NODE_WIDTH,
  NODE_HEIGHT,
  LAYOUT_WIDTH,
  LAYOUT_HEIGHT,
  CANVAS_SCALE_TOOLBAR_CONFIG,
} from './constant';

function mergePort(ports = []) {
  return DEFAULT_PORTS_ITEMS.map((defaultItem) => {
    const port = ports.find((portItem) => portItem.group === defaultItem.group);
    return port || defaultItem;
  });
}
Graph.registerNode(
  'custom-rect',
  {
    inherit: 'react-shape',
    component: <ApplicationNode />,
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    ports: { ...DEFAULT_PORTS },
  },
  true,
);

Graph.registerEdge(
  'custom-edge',
  {
    inherit: 'edge',
    attrs: {
      line: {
        stroke: '#A2B1C3',
        strokeWidth: 2,
        targetMarker: {
          name: 'block',
          width: 12,
          height: 8,
        },
      },
    },
    zIndex: 0,
  },
  true,
);

const graphConfig = {
  grid: true,
  autoResize: true,
  panning: true,
  mousewheel: true,
  connecting: {
    router: {
      name: 'manhattan',
      args: {
        padding: 8,
      },
    },
    connector: {
      name: 'rounded',
      args: {
        radius: 8,
      },
    },
    // anchor: 'center',
    connectionPoint: 'anchor',
    allowBlank: false,
    snap: {
      radius: 20,
    },
    createEdge() {
      return this.createEdge({
        shape: 'custom-edge',
      });
    },
    validateConnection({ targetMagnet }) {
      return !!targetMagnet;
    },
  },
  highlighting: {
    magnetAdsorbed: {
      name: 'stroke',
      args: {
        attrs: {
          fill: '#5F95FF',
          stroke: '#5F95FF',
        },
      },
    },
  },
  // resizing: true,
  // rotating: true,
  selecting: {
    enabled: true,
    showNodeSelectionBox: true,
  },
  snapline: true,
  keyboard: true,
  clipboard: true,
};
/**
 * ?????????????????????
 */
function getGraphData() {
  return getTopologyDetail().then((result) => {
    let nodes = result.res?.nodes || [];
    // ???????????????????????? ?????????????????????
    let isNeedGridLayout = true; // ???????????????????????????
    const { x, y } = nodes?.[0] || {};
    if (isNumber(x) && isNumber(y)) {
      isNeedGridLayout = false;
    }
    const graphData = {
      nodes: nodes?.map((item) => {
        let position;
        if (isNumber(item.x) && isNumber(item.y)) {
          position = { x: item.x, y: item.y };
        } else if (!isNeedGridLayout) {
          // ???????????????????????????xy??? ???position????????????
          position = { x: 10, y: 50 };
        }
        return {
          id: item.id,
          shape: 'custom-rect',
          label: item.name,
          position,
          ports: mergePort(item.nodePoints),
          data: item,
        };
      }),
      edges: result.res?.edges?.map((item) => ({
        shape: 'custom-edge',
        source: {
          cell: item.source,
          port: item.sourcePoint,
        },
        target: {
          cell: item.target,
          port: item.targetPoint,
        },
        data: item,
      })),
      isNeedGridLayout,
    };
    return graphData;
  });
}

function getNodeId(node) {
  const { id } = node?.getData() || {};
  return id || node?.id;
}

function saveGraph(graph, params, { refresh }) {
  if (!graph) {
    notification.info({ message: '?????????' });
    return;
  }
  let nodes = graph.getNodes();
  nodes = nodes.map((node) => {
    const position = node.position();
    // ??????data
    const data = node.getData();
    // ??????data??????????????????????????????????????????
    const nodeData = pick(data, ['name', 'icon']);
    // ?????????port
    let ports = node.getPorts();

    return {
      ...nodeData,
      ...position,
      id: getNodeId(node),
      nodePoints: ports,
    };
  });
  let edges = graph.getEdges();
  edges = edges.map((edge) => {
    const sourceNode = edge.getSourceNode();
    const targetNode = edge.getTargetNode();
    let sourceNodeId, targetNodeId;
    // ??????node id
    if (sourceNode) {
      sourceNodeId = getNodeId(sourceNode);
    }
    // ??????node id
    if (targetNode) {
      targetNodeId = getNodeId(targetNode);
    }
    // ?????? port id
    const sourcePortId = edge.getSourcePortId();
    // ?????? port id
    const targetPortId = edge.getTargetPortId();
    return {
      source: sourceNodeId,
      sourcePoint: sourcePortId,
      target: targetNodeId,
      targetPoint: targetPortId,
    };
  });
  console.log({ ...params, nodes, edges });
  notification.success({ message: '????????????' });
  refresh && refresh();
}

function resetGraph(graph) {
  graph.clearCells();
}

function removeSelectedCells(graph) {
  const cells = graph.getSelectedCells();
  if (!cells || !cells.length) {
    notification.info({ message: '????????????' });
    return;
  }
  graph.removeCells(cells);
}

function TopologyEdit(props) {
  const { id } = props;
  const graphContainer = React.useRef(null);
  const stencilContainer = React.useRef(null);

  // ??????????????????
  const [state, setState] = useSetState({
    optCol: null,
    actionType: 'preview',
    actionVisible: false,
    selectedRowKeys: [], // ??????????????????
    graph: undefined, // ????????????
  });
  const { actionVisible, optCol, graph } = state;

  // ?????????????????????
  const [graphState, setGraphState] = useSetState({});

  // ?????????????????????
  const { data: graphData, refresh } = useRequest(
    (params) => getGraphData({ ...params, id }),
    {
      refreshDeps: [id],
    },
  );

  // ???????????????
  const operationCallback = useCallback(
    ({ dataSource }) => {
      setState({
        optCol: dataSource,
        actionVisible: true,
      });
    },
    [setState],
  );
  // ????????????
  const handleCancel = useCallback(() => {
    setState({
      actionVisible: false,
    });
  }, [setState]);

  // ????????????
  const handleOk = useCallback(
    (dataSource) => {
      // ????????????
      handleCancel();
      // ????????????
      const { x6NodeId, ...restData } = dataSource;
      const currentNode = graph.getCellById(x6NodeId);
      // ??????????????????
      currentNode.setData(restData);
    },
    [handleCancel, graph],
  );

  // ??????????????????????????????
  function handleNodeDblclick({ node }) {
    const { data, id } = node;
    operationCallback({ dataSource: { ...data, x6NodeId: id } });
  }
  // Toolbar
  // ????????????
  const handleSave = useCallback(() => {
    saveGraph(graph, { id }, { refresh });
  }, [graph, refresh]);
  // ????????????
  const handleReset = useCallback(() => {
    Modal.confirm({
      title: '??????',
      content: '??????????????????????????????',
      okType: 'danger',
      onOk: () => {
        resetGraph(graph);
      },
    });
    // resetGraph(graph);
  }, [graph]);
  // ??????????????????????????????
  const handleRemoveSelectedCells = useCallback(() => {
    removeSelectedCells(graph);
  }, [graph]);
  // ?????????????????????????????????????????????
  const toggleMultiSelect = useCallback(() => {}, [graph]);
  const TOOLBAR_LIST = [
    {
      title: '??????',
      icon: <SaveOutlined />,
      onClick: handleSave,
    },
    {
      title: '??????',
      icon: <ClearOutlined />,
      onClick: handleReset,
    },
    {
      title: '??????',
      icon: <DeleteOutlined />,
      onClick: handleRemoveSelectedCells,
    },
    // {
    //   title: '??????',
    //   icon: <DeleteOutlined/>,
    //   onClick: toggleMultiSelect
    // },
  ];

  // ???????????????
  useEffect(() => {
    const container = graphContainer.current;
    // #region ???????????????
    const graph = new Graph({
      ...graphConfig,
      container: container,
    });
    // #endregion

    // ??????????????????
    // ??????????????????
    addPortEvent(graph, graphContainer.current);
    // ????????????
    graph.on('node:dblclick', handleNodeDblclick);

    // #region ????????? stencil
    const stencil = new Addon.Stencil({
      title: '?????????',
      target: graph,
      stencilGraphWidth: 180,
      stencilGraphHeight: 180,
      collapsable: true,
      groups: [
        {
          title: '??????',
          name: 'group1',
        },
      ],
      layoutOptions: {
        columns: 1,
        columnWidth: NODE_WIDTH,
        rowHeight: 55,
      },
      getDragNode(node) {
        let newNode = node.clone();
        newNode.updateData({ isNodeTreePanel: undefined });
        return newNode;
      },
    });

    const nodeApplication = graph.createNode({
      shape: 'custom-rect',
      data: {
        name: 'node',
        isNodeTreePanel: true, // ?????????????????????????????????????????????
      },
    });
    const nodeBusiness = graph.createNode({
      shape: 'custom-rect',
      data: {
        name: 'antv',
        isNodeTreePanel: true,
      },
    });
    stencil.load([nodeApplication, nodeBusiness], 'group1');
    stencilContainer?.current?.appendChild(stencil.container);

    setState({ graph });
  }, []);
  useUpdateEffect(() => {
    if (graph && graphData) {
      let { isNeedGridLayout, nodes, edges } = graphData;
      // ???????????????????????????
      if (!isNeedGridLayout) {
        graph.fromJSON(graphData);
        // nodes = (nodes || []).map(item => {
        //   return graph.createNode(item);
        // });
        // edges = (edges || []).map(item => {
        //   return graph.createEdge(item);
        // });
        // graph.resetCells([...nodes, ...edges]);
        // // graph.centerContent();
      } else {
        const gridLayout = new GridLayout({
          type: 'grid',
          width: LAYOUT_WIDTH,
          height: LAYOUT_HEIGHT,
          sortBy: 'label',
          rows: 4,
          cols: 4,
          nodeSize: [NODE_WIDTH, NODE_HEIGHT],
        });

        const model = gridLayout.layout({ nodes, edges });
        graph.fromJSON(model);
      }
    }
  }, [graphData]);

  return (
    <Row className={styles.topologyEdit}>
      <Col flex="180px" className={styles.stencilCol}>
        <div className={styles.stencilContainer} ref={stencilContainer} />
      </Col>
      <Col flex="1" className={styles.right}>
        <div className={styles.graphOperation}>
          <Space
            split={<Divider type="vertical" />}
            size={0}
            style={{ marginTop: '3px' }}
          >
            {TOOLBAR_LIST.map((item, index) => (
              <Tooltip key={index} title={item.title}>
                <Button
                  className={styles.operationButton}
                  icon={item.icon}
                  type="text"
                  onClick={item.onClick}
                ></Button>
              </Tooltip>
            ))}
          </Space>
        </div>
        <div ref={graphContainer} className={styles.graphContainer}></div>
        <CanvasScaleToolbar
          className={styles.canvasScaleToolbar}
          graphInstance={graph}
        ></CanvasScaleToolbar>
      </Col>

      <DrawerOperation
        visible={actionVisible}
        actionType="edit"
        dataSource={optCol}
        onOk={handleOk}
        onClose={handleCancel}
        onCancel={handleCancel}
      />
    </Row>
  );
}

export default TopologyEdit;
