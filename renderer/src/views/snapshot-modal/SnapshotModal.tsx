import React, {
  forwardRef, useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import {
  Button,
  Modal,
} from 'antd';
import './index.scss';
import { centralEventBus } from '../../helpers/eventbus';
import { Subscription } from 'rxjs';

export interface SnapshotModalInstance {
  show(): void;
  hide(): void;
}

interface Props {
  onChange?(base64: string): void;
}

const SnapshotModal = forwardRef<SnapshotModalInstance | undefined, Props>((props, ref) => {

  const { onChange } = props;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let subscription: Subscription;
    if (visible) {
      subscription = centralEventBus.on('screenshot').subscribe((res) => {
        centralEventBus.emit('focus');
        if (typeof onChange === 'function') {
          setVisible(false);
          onChange(res.message);
        }
      });
    }
    return () => subscription?.unsubscribe();
  }, [visible, onChange]);

  const minimize = useCallback(() => {
    centralEventBus.emit('minimize');
  }, []);

  useImperativeHandle(ref, () => {
    return {
      show() {
        setVisible(true);
      },
      hide() {
        setVisible(false);
      },
    };
  });

  return (
    <Modal
      title={null}
      visible={visible}
      closable={false}
      footer={null}
      className={'snapshot-modal'}
      bodyStyle={{padding: 0}}
    >
      <div className={'content'}>
        <h2>你可以使用以下任意一种方式截图</h2>
        <p>1、<Button type={'link'} size={'small'} onClick={minimize}>最小化</Button>程序后，按下 <code>ctrl + alt + 0</code> 截图，注意：不要关闭该弹窗。</p>
        <p>Some contents...</p>
        <p>Some contents...</p>
        <p>注意：必须是全屏截图</p>
      </div>
      <div className={'footer'}>
        <Button
          block
          type={'text'}
          size={'large'}
          onClick={() => setVisible(false)}
        >取消</Button>
      </div>
    </Modal>
  );
});

export { SnapshotModal };
