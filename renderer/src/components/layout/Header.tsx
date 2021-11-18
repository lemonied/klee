import React, { FC, useCallback } from 'react';
import { CloseOutlined, MinusOutlined } from '@ant-design/icons';
import { centralEventbus } from '../../helpers/eventbus';
import './Header.scss';
import { Modal } from 'antd';

const Header: FC = () => {
  const onClose = useCallback(() => {
    Modal.confirm({
      title: '提示',
      content: '确定退出？',
      onOk() {
        centralEventbus.emit('close');
      },
    });
  }, []);
  const onMinimize = useCallback(() => {
    centralEventbus.emit('minimize');
  }, []);

  return (
    <div className={'glo-header'}>
      <div className={'app-drag'} />
      <div className={'operation'}>
        <div className={'minimize'} onClick={onMinimize}>
          <MinusOutlined />
        </div>
        <div className={'close'} onClick={onClose}>
          <CloseOutlined />
        </div>
      </div>
    </div>
  );
};

export { Header };
