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
 * 获取拓扑图数据
 */
function getGraphData() {
  return getTopologyDetail().then((result) => {
    let nodes = result.res?.nodes || [];
    // 第一个节点有坐标 就默认都有坐标
    let isNeedGridLayout = true; // 是否需要初始化布局
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
          // 不需要初始化且没有xy时 将position放左上角
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
    notification.info({ message: '无画布' });
    return;
  }
  let nodes = graph.getNodes();
  nodes = nodes.map((node) => {
    const position = node.position();
    // 业务data
    const data = node.getData();
    // 业务data中内容太多了，很多字段用不到
    const nodeData = pick(data, ['name', 'icon']);
    // 节点的port
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
    // 起点node id
    if (sourceNode) {
      sourceNodeId = getNodeId(sourceNode);
    }
    // 终点node id
    if (targetNode) {
      targetNodeId = getNodeId(targetNode);
    }
    // 起点 port id
    const sourcePortId = edge.getSourcePortId();
    // 终点 port id
    const targetPortId = edge.getTargetPortId();
    return {
      source: sourceNodeId,
      sourcePoint: sourcePortId,
      target: targetNodeId,
      targetPoint: targetPortId,
    };
  });
  console.log({ ...params, nodes, edges });
  notification.success({ message: '保存成功' });
  refresh && refresh();
}

function resetGraph(graph) {
  graph.clearCells();
}

function removeSelectedCells(graph) {
  const cells = graph.getSelectedCells();
  if (!cells || !cells.length) {
    notification.info({ message: '无选中项' });
    return;
  }
  graph.removeCells(cells);
}

function TopologyEdit(props) {
  const { id } = props;
  const graphContainer = React.useRef(null);
  const stencilContainer = React.useRef(null);

  // 编辑弹框属性
  const [state, setState] = useSetState({
    optCol: null,
    actionType: 'preview',
    actionVisible: false,
    selectedRowKeys: [], // 表格列选中行
    graph: undefined, // 画布实例
  });
  const { actionVisible, optCol, graph } = state;

  // 画图当前的状态
  const [graphState, setGraphState] = useSetState({});

  // 获取拓扑图数据
  const { data: graphData, refresh } = useRequest(
    (params) => getGraphData({ ...params, id }),
    {
      refreshDeps: [id],
    },
  );

  // 表格操作列
  const operationCallback = useCallback(
    ({ dataSource }) => {
      setState({
        optCol: dataSource,
        actionVisible: true,
      });
    },
    [setState],
  );
  // 弹框关闭
  const handleCancel = useCallback(() => {
    setState({
      actionVisible: false,
    });
  }, [setState]);

  // 弹框保存
  const handleOk = useCallback(
    (dataSource) => {
      // 关闭弹框
      handleCancel();
      // 更新节点
      const { x6NodeId, ...restData } = dataSource;
      const currentNode = graph.getCellById(x6NodeId);
      // 业务数据更新
      currentNode.setData(restData);
    },
    [handleCancel, graph],
  );

  // 节点双击，展示编辑框
  function handleNodeDblclick({ node }) {
    const { data, id } = node;
    operationCallback({ dataSource: { ...data, x6NodeId: id } });
  }
  // Toolbar
  // 节点保存
  const handleSave = useCallback(() => {
    saveGraph(graph, { id }, { refresh });
  }, [graph, refresh]);
  // 清空画布
  const handleReset = useCallback(() => {
    Modal.confirm({
      title: '清空',
      content: '是否清空画布所有数据',
      okType: 'danger',
      onOk: () => {
        resetGraph(graph);
      },
    });
    // resetGraph(graph);
  }, [graph]);
  // 删除选中元素及关联项
  const handleRemoveSelectedCells = useCallback(() => {
    removeSelectedCells(graph);
  }, [graph]);
  // 多选和平移切换只能保留其中一个
  const toggleMultiSelect = useCallback(() => {}, [graph]);
  const TOOLBAR_LIST = [
    {
      title: '保存',
      icon: <SaveOutlined />,
      onClick: handleSave,
    },
    {
      title: '清空',
      icon: <ClearOutlined />,
      onClick: handleReset,
    },
    {
      title: '删除',
      icon: <DeleteOutlined />,
      onClick: handleRemoveSelectedCells,
    },
    // {
    //   title: '框选',
    //   icon: <DeleteOutlined/>,
    //   onClick: toggleMultiSelect
    // },
  ];

  // 初始化画布
  useEffect(() => {
    const container = graphContainer.current;
    // #region 初始化画布
    const graph = new Graph({
      ...graphConfig,
      container: container,
    });
    // #endregion

    // 添加画布事件
    // 连接桩的事件
    addPortEvent(graph, graphContainer.current);
    // 节点事件
    graph.on('node:dblclick', handleNodeDblclick);

    // #region 初始化 stencil
    const stencil = new Addon.Stencil({
      title: '拓扑图',
      target: graph,
      stencilGraphWidth: 180,
      stencilGraphHeight: 180,
      collapsable: true,
      groups: [
        {
          title: '节点',
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
        isNodeTreePanel: true, // 可以用这个标识是不是在节点树里
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
      // 是否需要初始化布局
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
