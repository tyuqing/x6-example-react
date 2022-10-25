// 控制连接桩显示/隐藏
const showPorts = (ports, show) => {
  for (let i = 0, len = ports.length; i < len; i = i + 1) {
    ports[i].style.visibility = show ? 'visible' : 'hidden';
  }
};
// 连接桩的事件
export function addPortEvent(graph, container) {
  graph.on('node:mouseenter', () => {
    const ports = container.querySelectorAll('.x6-port-body');
    showPorts(ports, true);
  });
  graph.on('node:mouseleave', () => {
    const ports = container.querySelectorAll('.x6-port-body');
    showPorts(ports, false);
  });
}
