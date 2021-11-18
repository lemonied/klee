import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import {
  Button,
  Modal,
} from 'antd';
import './index.scss';
import { centralEventbus } from '../../helpers/eventbus';
import { Subscription } from 'rxjs';
import { useSnapshot } from '../picker/snapshot';

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
  const [snapshot] = useSnapshot();

  useEffect(() => {
    let subscription: Subscription;
    if (visible) {
      subscription = centralEventbus.on('screenshot').subscribe((res) => {
        centralEventbus.emit('focus');
        if (typeof onChange === 'function') {
          setVisible(false);
          onChange(res.message);
        }
      });
    }
    return () => subscription?.unsubscribe();
  }, [visible, onChange]);
  
  const handleHistory = useCallback(() => {
    if (typeof onChange === 'function' && snapshot) {
      onChange(snapshot.base64);
      setVisible(false);
    }
  }, [onChange, snapshot]);

  const minimize = useCallback(() => {
    centralEventbus.emit('minimize');
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
        <p>3、使用<Button type={'link'} disabled={!snapshot} onClick={handleHistory}>上一次截图</Button></p>
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
