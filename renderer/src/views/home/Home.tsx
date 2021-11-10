import React, { FC, useRef } from 'react';
import {
  Button,
  Avatar,
} from 'antd';
import {
  FileImageOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { SnapshotModal, SnapshotModalInstance } from '../snapshot-modal/SnapshotModal';
import './index.scss';

const Home: FC = () => {

  const modalRef = useRef<SnapshotModalInstance>();

  return (
    <>
      <div className={'home'}>
        <p>
          <Link to={'/about'}>
            <Button>关于</Button>
          </Link>
        </p>
        <div>
          <span onClick={() => modalRef.current?.show()}>
            <Avatar
              className={'link'}
              size={'large'}
              shape={'square'}
              icon={<FileImageOutlined />}
            />
          </span>
        </div>
      </div>
      <SnapshotModal ref={modalRef} />
    </>
  );
};

export { Home };
