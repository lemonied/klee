import React, { FC, useCallback, useState } from 'react';
import {
  Button,
} from 'antd';
import { Link } from 'react-router-dom';
import './index.scss';
import { ProcessForm } from '../process-form/ProcessForm';
import { useProcessList, filterProcess } from '../process-form/process-list';
import { centralEventbus } from '../../helpers/eventbus';
import { finalize } from 'rxjs';

const Home: FC = () => {

  const [process] = useProcessList();
  const [loading, setLoading] = useState(false);
  const [processState, setProcessState] = useState(false);

  const startProcess = useCallback(() => {
    setLoading(true);
    centralEventbus.emit('start-process', filterProcess(process.toJS())).pipe(
      finalize(() => setLoading(false)),
    ).subscribe(res => {
      setProcessState(true);
    });
  }, [process]);
  const cancelProcess = useCallback(() => {
    setLoading(true);
    centralEventbus.emit('stop-process').pipe(
      finalize(() => setLoading(false)),
    ).subscribe(res => {
      setProcessState(false);
    });
  }, []);

  return (
    <>
      <div className={'home'}>
        <p>
          <Link to={'/about'}>
            <Button>关于</Button>
          </Link>
        </p>
        <ProcessForm disabled={processState || loading} />
        <div className={'process-operator'}>
          {
            processState ?
              (<Button type={'default'} loading={loading} danger onClick={cancelProcess}>停止</Button>) :
              (<Button type={'primary'} loading={loading} onClick={startProcess}>启动</Button>)
          }
        </div>
      </div>
    </>
  );
};

export { Home };
