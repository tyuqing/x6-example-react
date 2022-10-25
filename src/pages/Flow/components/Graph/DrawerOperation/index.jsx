import React, { useRef, useCallback } from 'react';
import Operation from './Operation';
import { Drawer, Space, Button } from 'antd';

const getDialogTitle = (actionType) => {
  switch (actionType) {
    case 'edit':
      return '编辑节点';

    case 'preview':
      return '预览节点';
    case 'add':
    default:
      return '添加节点';
  }
};

const DialogOperation = (props) => {
  const {
    actionType,
    dataSource,
    onOk = () => {},
    visible,
    ...lastProps
  } = props;
  const operationRef = useRef(null);
  const handleOk = useCallback(() => {
    if (actionType === 'preview') {
      // @ts-ignore
      onOk(null);
    }

    operationRef.current?.getValues((values) => {
      onOk({
        ...values,
        x6NodeId: dataSource.x6NodeId,
      });
    });
  }, [actionType, onOk, dataSource]);
  return (
    <Drawer
      title={getDialogTitle(actionType)}
      width={500}
      closable={false}
      visible={visible}
      {...lastProps}
      extra={
        <Space>
          <Button onClick={lastProps.onClose}>取消</Button>
          <Button type="primary" onClick={handleOk}>
            确认
          </Button>
        </Space>
      }
    >
      {visible && (
        <Operation
          ref={operationRef}
          actionType={actionType}
          dataSource={dataSource}
        />
      )}
    </Drawer>
  );
};

export default DialogOperation;
