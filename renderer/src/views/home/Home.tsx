import React, { ChangeEvent, FC, useCallback, useMemo, useRef, useState } from 'react';
import {
  Button,
  Switch,
  Radio,
  RadioChangeEvent,
  Select,
  InputNumber,
  Tooltip,
  Tabs,
} from 'antd';
import { Link } from 'react-router-dom';
import './index.scss';
import { ProcessForm } from '../process-form/ProcessForm';
import {
  useProcessList,
  filterProcess,
  useSecondaryProcessList,
} from '../process-form/process-list';
import { centralEventbus } from '../../helpers/eventbus';
import { finalize } from 'rxjs';
import { downloadJson } from '../../helpers/utils';
import { fromJS } from 'immutable';
import { useBaseConfig } from './base-config';
import {
  useProcessLoading,
  useProcessState,
} from './process-state';

const { Option } = Select;
const { TabPane } = Tabs;

const Home: FC = () => {

  const [process, setProcess] = useProcessList();
  const [loading, setLoading] = useProcessLoading();
  const [processState, setProcessState] = useProcessState();
  const [reading, setReading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filename = useRef('config.json');

  const [list, setList] = useProcessList();
  const [secondaryList, setSecondaryList] = useSecondaryProcessList();

  const [config, setConfig] = useBaseConfig();

  const startProcess = useCallback(() => {
    setLoading(true);
    centralEventbus.emit('listener-config', config);
    centralEventbus.emit(
      'start-process',
      {
        mainProcess: filterProcess(process.toJS()),
        secondaryProcess: filterProcess(secondaryList.toJS()),
      },
    ).pipe(
      finalize(() => setLoading(false)),
    ).subscribe(() => {
      setProcessState(true);
    });
  }, [config, process, secondaryList, setLoading, setProcessState]);
  const cancelProcess = useCallback(() => {
    setLoading(true);
    centralEventbus.emit('stop-process').pipe(
      finalize(() => setLoading(false)),
    ).subscribe(() => {
      setProcessState(false);
    });
  }, [setLoading, setProcessState]);
  const onLogSwitchChange = useCallback((checked: boolean) => {
    centralEventbus.emit(checked ? 'log-on' : 'log-off');
  }, []);
  const onTriggerTypeChange = useCallback((e: RadioChangeEvent) => {
    const type = e.target.value;
    setConfig(Object.assign({}, config, { type }));
    centralEventbus.emit('trigger-type', type);
  }, [config, setConfig]);
  const handleTriggerButton = useCallback((button: number) => {
    setConfig(Object.assign({}, config, { button }));
    centralEventbus.emit('trigger-button', button);
  }, [config, setConfig]);
  const handleWorkerDelay = useCallback((workerDelay: number) => {
    setConfig(Object.assign({}, config, { workerDelay }));
    centralEventbus.emit('snapshot-timeout', workerDelay);
  }, [config, setConfig]);
  const download = useCallback(() => {
    downloadJson({
      data: process,
      secondaryData: secondaryList,
      config,
    },filename.current);
  }, [config, process, secondaryList]);
  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target?.files && e.target?.files[0];
    if (file) {
      setReading(true);
      const reader = new FileReader();
      reader.onload = function() {
        const json = JSON.parse((this.result as any));
        json.data && setProcess(fromJS(json.data) as any);
        json.secondaryData && setSecondaryList(fromJS(json.secondaryData) as any);
        json.config && setConfig(json.config);
        setReading(false);
        filename.current = file.name;
      };
      reader.onerror = function() {
        setReading(false);
      };
      reader.readAsText(file);
    }
  }, [setConfig, setProcess, setSecondaryList]);
  const formDisabled = useMemo(() => {
    return processState || loading;
  }, [loading, processState]);

  return (
    <>
      <div className={'home'}>
        {
          reading ?
            null :
            <input style={{ display: 'none' }} ref={fileInputRef} type="file" accept={'application/json'} onChange={handleFileChange} />
        }
        <div className={'home-content'}>
          <Tabs type="card">
            <TabPane tab="主线程" key="1">
              <ProcessForm
                disabled={formDisabled}
                list={list}
                setList={setList}
              />
            </TabPane>
            <TabPane tab="副线程" key="2">
              <ProcessForm
                disabled={formDisabled}
                list={secondaryList}
                setList={setSecondaryList}
              />
            </TabPane>
          </Tabs>
          <div style={{ textAlign: 'center', paddingBottom: 10 }}>
            <Button type={'link'}>
              <Link to={'/about'}>关于作者</Link>
            </Button>
            <Button type={'link'}>
              <Link to={'/experiment'}>测试</Link>
            </Button>
          </div>
        </div>
        <div className={'process-operator'}>
          <Tooltip
            title={'开启/关闭调试模式：开启调试模式后，图像解析结果将打印在控制台（按F12打开控制台）'}
            placement={'rightTop'}
          >
            <Switch onChange={onLogSwitchChange} />
          </Tooltip>
          <div className={'save'}>
            <Button
              size={'small'}
              ghost
              type={'primary'}
              onClick={download}
            >保存配置</Button>
            <Button
              size={'small'}
              ghost
              type={'primary'}
              style={{ marginLeft: 5 }}
              onClick={() => fileInputRef.current?.click()}
            >导入</Button>
          </div>
          <div className={'config'}>
            <Tooltip
              title={`图像解析频率，如果启用了取色流程，则每${config.workerDelay}毫秒解析一次图像，值越小消耗的系统性能越大`}
            >
              <InputNumber
                style={{ width: 150 }}
                min={0}
                step={1}
                value={config.workerDelay}
                onChange={handleWorkerDelay}
                addonAfter={'毫秒'}
                disabled={formDisabled}
              />
            </Tooltip>
            <Select
              value={config.button}
              onChange={handleTriggerButton}
              disabled={formDisabled}
            >
              <Option value={1}>左键</Option>
              <Option value={2}>右键</Option>
              <Option value={4}>侧键一</Option>
              <Option value={5}>侧键二</Option>
            </Select>
            <Radio.Group
              onChange={onTriggerTypeChange}
              value={config.type}
              disabled={formDisabled}
            >
              <Radio value={'press'}>
                <Tooltip title={'按下开始松开停止'}>
                  <span>模式一</span>
                </Tooltip>
              </Radio>
              <Radio value={'click'}>
                <Tooltip title={'点击开始，再次点击结束'}>
                  <span>模式二</span>
                </Tooltip>
              </Radio>
            </Radio.Group>
          </div>
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
