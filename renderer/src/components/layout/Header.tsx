import React, { FC, useCallback, useState } from 'react';
import {
  CloseOutlined,
  MinusOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
} from '@ant-design/icons';
import { centralEventbus } from '../../helpers/eventbus';
import './Header.scss';
import icon from './assets/favicon.png';
import { Modal } from 'antd';

const Header: FC = () => {
  const [maximize, setMaximize] = useState(false);
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
  
  const toggleMaximize = useCallback(() => {
    if (maximize) {
      centralEventbus.emit('unmaximize');
    } else {
      centralEventbus.emit('maximize');
    }
    setMaximize(!maximize);
  }, [maximize]);

  return (
    <div className={'glo-header'}>
      <div className={'app-drag'}>
        <img className={'icon'} src={icon} alt="icon"/>
        <span>取色宏</span>
      </div>
      <div className={'operation'}>
        <div className={'minimize'} onClick={onMinimize}>
          <MinusOutlined />
        </div>
        <div className={'maximize'} onClick={toggleMaximize}>
          {
            maximize ?
              <FullscreenExitOutlined /> :
              <FullscreenOutlined />
          }
        </div>
        <div className={'close'} onClick={onClose}>
          <CloseOutlined />
        </div>
      </div>
    </div>
  );
};

export { Header };
