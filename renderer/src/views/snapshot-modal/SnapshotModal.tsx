import React, {
  forwardRef,
  useImperativeHandle,
  useState,
} from 'react';
import {
  Button,
  Modal,
} from 'antd';
import './index.scss';

export interface SnapshotModalInstance {
  show(): void;
  hide(): void;
}

interface Props {

}

const SnapshotModal = forwardRef<SnapshotModalInstance | undefined, Props>((props, ref) => {

  const [visible, setVisible] = useState(false);

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
        <p>Some contents...</p>
        <p>Some contents...</p>
        <p>Some contents...</p>
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
