import React, { FC, useCallback } from 'react';
import {
  Button,
} from 'antd';
import { Link } from 'react-router-dom';
import './index.scss';
import { ProcessForm } from '../process-form/ProcessForm';
import { useProcessList, filterProcess } from '../process-form/process-list';
import { centralEventBus } from '../../helpers/eventbus';

const Home: FC = () => {

  const [process] = useProcessList();

  const startProcess = useCallback(() => {
    centralEventBus.emit('process-list', filterProcess(process)).subscribe(res => {
      // eslint-disable-next-line no-console
      console.log(res);
    });
  }, [process]);

  return (
    <>
      <div className={'home'}>
        <p>
          <Link to={'/about'}>
            <Button>关于</Button>
          </Link>
        </p>
        <ProcessForm />
        <div className={''}>
          <Button type={'primary'} onClick={startProcess}>启动</Button>
        </div>
      </div>
    </>
  );
};

export { Home };
