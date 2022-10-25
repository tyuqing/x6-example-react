import { CANVAS_SCALE_TOOLBAR_CONFIG, XFlowGraphCommands } from '../constant';
import { Toolbar } from '@antv/x6-react-components';
import '@antv/x6-react-components/es/toolbar/style/index.css';
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  OneToOneOutlined,
  CompressOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
} from '@ant-design/icons';
import { useSetState } from 'ahooks';

import styles from './index.less';

function CanvasScaleToolbar(props) {
  const { className, graphInstance } = props;
  const [scaleState, updateScaleState] = useSetState({
    zoomFactor: 1,
    fullscreen: 1,
  });
  const { zoomFactor, fullscreen } = scaleState;

  const executeCommand = {
    [XFlowGraphCommands.GRAPH_ZOOM.id]({
      factor,
      zoomOptions = CANVAS_SCALE_TOOLBAR_CONFIG.zoomOptions,
    }) {
      // graphInstance.centerContent()
      // return
      let zoomCount = graphInstance.zoom();
      zoomCount = zoomCount + factor;
      if (
        (zoomCount > zoomOptions.minScale &&
          zoomCount < zoomOptions.maxScale) ||
        zoomCount === zoomOptions.minScale ||
        zoomCount === zoomOptions.maxScale
      ) {
        graphInstance.zoom(factor);
      }
    },
  };

  const scaleToolBar = [
    {
      name: 'main',
      items: [
        {
          id: CANVAS_SCALE_TOOLBAR_CONFIG.ZOOM_IN,
          tooltip: '放大',
          icon: <ZoomInOutlined />,
          onClick: () => {
            executeCommand[XFlowGraphCommands.GRAPH_ZOOM.id]?.({
              factor: 0.1,
              zoomOptions: CANVAS_SCALE_TOOLBAR_CONFIG.zoomOptions,
            });
          },
        },
        {
          id: CANVAS_SCALE_TOOLBAR_CONFIG.ZOOM_OUT,
          tooltip: '缩小',
          icon: <ZoomOutOutlined />,
          onClick: () => {
            executeCommand[XFlowGraphCommands.GRAPH_ZOOM.id]?.({
              factor: -0.1,
              zoomOptions: CANVAS_SCALE_TOOLBAR_CONFIG.zoomOptions,
            });
          },
        },
        // {
        //   id: CANVAS_SCALE_TOOLBAR_CONFIG.SCALE_TO_ONE,
        //   icon: <OneToOneOutlined />,
        //   tooltip: '缩放到1:1',
        //   isEnabled: zoomFactor !== 1,
        //   onClick: () => {
        //     executeCommand[XFlowGraphCommands.GRAPH_ZOOM.id]?.({
        //       factor: 'real',
        //       zoomOptions: CANVAS_SCALE_TOOLBAR_CONFIG.zoomOptions,
        //     });
        //   },
        // },
        // {
        //   id: CANVAS_SCALE_TOOLBAR_CONFIG.SCALE_TO_FIT,
        //   tooltip: '缩放到适应屏幕',
        //   icon: <CompressOutlined />,
        //   onClick: () => {
        //     executeCommand[XFlowGraphCommands.GRAPH_ZOOM.id]?.({
        //       factor: 'fit',
        //       zoomOptions: CANVAS_SCALE_TOOLBAR_CONFIG.zoomOptions,
        //     });
        //   },
        // },
        // {
        //   id: CANVAS_SCALE_TOOLBAR_CONFIG.FULLSCREEN,
        //   tooltip: !fullscreen ? '全屏' : '退出全屏',
        //   icon: !fullscreen ? <FullscreenOutlined /> : <FullscreenExitOutlined />,
        //   onClick: ({ commandService }) => {
        //     commandService.executeCommand(XFlowGraphCommands.GRAPH_FULLSCREEN.id, {});
        //   },
        // },
      ],
    },
  ];

  function handleToolbarClick(name) {
    let temp = executeCommand[name];
    temp && temp(name);
  }
  return (
    <div className={`${styles.toolbar} ${className}`}>
      <Toolbar hoverEffect>
        {scaleToolBar.map((groupItem) => (
          <Toolbar.Group key={groupItem.name}>
            {groupItem.items.map((item) => (
              <Toolbar.Item
                key={item.id}
                name={item.id}
                tooltip={item.tooltip}
                icon={item.icon}
                tooltipProps={{ placement: 'left' }}
                onClick={item.onClick}
              />
            ))}
          </Toolbar.Group>
        ))}
      </Toolbar>
    </div>
  );
}

export default CanvasScaleToolbar;
