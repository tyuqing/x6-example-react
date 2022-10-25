import { AppstoreOutlined } from '@ant-design/icons';
import { Avatar } from 'antd';
import React from 'react';
import { iconList } from '@/constants/graph';

import styles from './index.less';

function ApplicationNode(props) {
  const { node } = props;
  const data = node?.getData();
  const { name, isNodeTreePanel } = data;

  const label = name || '';
  const icon = iconList.find((item) => item.value === data.icon)?.icon || (
    <AppstoreOutlined />
  );

  return (
    <div className={styles.node}>
      <Avatar className={styles.img} shape="square" icon={icon} />
      {label ? (
        <span className={`${styles.label} ${styles.labelTitle}`} title={label}>
          {label}
        </span>
      ) : (
        <span
          className={`${styles.label} c-subsidiary`}
        >{`${label}(双击编辑信息)`}</span>
      )}
    </div>
  );
}

export default ApplicationNode;
