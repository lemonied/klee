import React, {
  FC,
  useCallback,
  useRef,
} from 'react';
import {
  Button,
  Avatar,
  Select,
  InputNumber,
  AutoComplete,
} from 'antd';
import {
  FileImageOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { SnapshotModal, SnapshotModalInstance } from '../snapshot-modal/SnapshotModal';
import './index.scss';
import { Picker, PickerInstance, CropperData } from '../picker/Picker';
import { List, Map, fromJS } from 'immutable';
import { centralEventBus } from '../../helpers/eventbus';
import { useProcessList } from './process-list';
import { average } from '../../helpers/utils';
import { keyboardMap } from './keyboard';

const { Option } = Select;

const ProcessForm: FC = () => {

  const [list, setList] = useProcessList();
  const listRef = useRef<any[]>();

  const modalRef = useRef<SnapshotModalInstance>();
  const pickerRef = useRef<PickerInstance>();

  const onPicked = useCallback((data: CropperData) => {
    centralEventBus.emit('select', data).subscribe((res) => {
      const crop = res.message;
      const lightness = average(crop.hsv.map((v: any) => v.v)).toFixed(4);
      let target = list.setIn(
        [...listRef.current!, 'crop'],
        Object.assign(data, { lightness }));
      target = target.setIn(
        [...listRef.current!, 'conditions'],
        fromJS([{ type: 'lightness', value: lightness, size: 'more' }]),
      );
      setList(target);
    });
  }, [list, setList]);

  const showModal = useCallback((arr: any[]) => {
    listRef.current = arr;
    modalRef.current?.show();
  }, []);

  return (
    <>
      <div className={'process-form'}>
        <FormRow
          list={list}
          onShowModal={showModal}
        />
      </div>
      <SnapshotModal ref={modalRef} onChange={pickerRef.current?.show} />
      <Picker onSubmit={onPicked} ref={pickerRef} />
    </>
  );
};

interface FormRowProps {
  list: List<any>;
  keyPath?: any[];
  onShowModal?(keyPath: any[]): void;
}
const FormRow: FC<FormRowProps> = (props) => {
  const { keyPath = [], list, onShowModal } = props;
  const [originList, setList] = useProcessList();
  const handleShowModal = useCallback((key: number) => {
    if (typeof onShowModal === 'function') {
      onShowModal([...keyPath, key]);
    }
  }, [keyPath, onShowModal]);
  const addRow = useCallback(() => {
    setList(originList.updateIn(keyPath, (value: any) => {
      return value.push(Map({
        type: 'general',
        children: List([]),
        key: '',
        keydown: 5,
        keyup: 5,
      }));
    }));
  }, [keyPath, originList, setList]);
  const handleTypeChange = useCallback((path: any[], value: string) => {
    let target = originList;
    if (value === 'general') {
      target = target.deleteIn([...path, 'crop']);
      target = target.deleteIn([...path, 'conditions']);
    } else if (value === 'picker') {
      target = target.deleteIn([...path, 'key']);
      target = target.deleteIn([...path, 'keydown']);
      target = target.deleteIn([...path, 'keyup']);
    }
    target = target.setIn([...path, 'type'], value);
    setList(target);
  }, [originList, setList]);
  // 条件类型
  const handleConditionChange = useCallback((keyPath: any[], value: string) => {
    let target = originList;
    target = target.setIn([...keyPath, 'type'], value);
    setList(target);
  }, [originList, setList]);
  // 条件值
  const handleConditionValueChange = useCallback((keyPath: any[], value: any) => {
    let target = originList;
    target = target.setIn([...keyPath, 'value'], value);
    setList(target);
  }, [originList, setList]);
  // 大于小于
  const handleSizeJudgment = useCallback((keyPath: any[], value: any) => {
    let target = originList;
    target = target.setIn([...keyPath, 'size'], value);
    setList(target);
  }, [originList, setList]);
  // 按键
  const handleKeyChange = useCallback((keyPath: any[], value: any) => {
    let target = originList;
    target = target.setIn([...keyPath, 'key'], value);
    setList(target);
  }, [originList, setList]);
  const handleKeydown = useCallback((keyPath: any[], value: any) => {
    let target = originList;
    target = target.setIn([...keyPath, 'keydown'], value);
    setList(target);
  }, [originList, setList]);
  const handleKeyup = useCallback((keyPath: any[], value: any) => {
    let target = originList;
    target = target.setIn([...keyPath, 'keyup'], value);
    setList(target);
  }, [originList, setList]);
  const getKeyOptions = useCallback((keyPath: any[]) => {
    const keyOptions = keyboardMap.map(v => ({ value: v }));
    const value = originList.getIn(keyPath) as string;
    if (!value) {
      return keyOptions;
    }
    try {
      return keyOptions.filter(v => new RegExp(value, 'ig').test(v.value));
    } catch (err) {
      return [];
    }
  }, [originList]);
  
  return (
    <>
      {
        list.map((v, k) => {
          return (
            <div className={'row'} key={k}>
              <div className={'line line-space'}>
                <Select
                  defaultValue={v.get('type')}
                  onChange={(e) => handleTypeChange([...keyPath, k], e)}
                >
                  <Option value="general">一般流程</Option>
                  <Option value="picker">条件流程</Option>
                </Select>
                {
                  v.get('type') === 'general' ?
                    (
                      <div className={'flex-align-center line-space'}>
                        <AutoComplete
                          placeholder={'输入按键'}
                          value={v.get('key')}
                          onChange={(e) => handleKeyChange([...keyPath, k], e)}
                          style={{ width: 150 }}
                          options={getKeyOptions([...keyPath, k, 'key'])}
                        />
                        <InputNumber
                          min={0}
                          step={1}
                          value={v.get('keydown')}
                          addonAfter={'毫秒'}
                          style={{ width: 150 }}
                          onChange={(value) => handleKeydown([...keyPath, k], value)}
                        />
                        <InputNumber
                          min={0}
                          step={1}
                          value={v.get('keyup')}
                          addonAfter={'毫秒'}
                          style={{ width: 150 }}
                          onChange={(value) => handleKeyup([...keyPath, k], value)}
                        />
                      </div>
                    ) :
                    (
                      <div className={'flex-align-center line-space'}>
                        <span>if</span>
                        <div onClick={() => handleShowModal(k)} className={'snapshot link'}>
                          {
                            v.get('crop') ?
                              <img src={v.get('crop')?.base64} alt="snapshot"/> :
                              <Avatar
                                className={'link'}
                                size={'large'}
                                shape={'square'}
                                icon={<FileImageOutlined />}
                              />
                          }
                        </div>
                        <div className={'flex-align-center'}>
                          {
                            v.get('conditions')?.map((condition: any, index: number) => (
                              <div className={'condition line-space'} key={index}>
                                <Select
                                  defaultValue={condition.get('type')}
                                  onChange={(e) => handleConditionChange([...keyPath, k, 'conditions', index], e)}
                                  style={{ minWidth: 100 }}
                                >
                                  <Option value="lightness">明亮度</Option>
                                  <Option value="texture">纹理相似度</Option>
                                  <Option value="absolute">完全相似度</Option>
                                </Select>
                                <Select
                                  defaultValue={condition.get('size')}
                                  onChange={(e) => handleSizeJudgment([...keyPath, k, 'conditions', index], e)}
                                >
                                  <Option value="more">大于</Option>
                                  <Option value="less">小于</Option>
                                </Select>
                                {
                                  condition.get('type') === 'lightness' ?
                                    <InputNumber
                                      min={0}
                                      max={1}
                                      step={0.0001}
                                      value={condition.get('value')}
                                      onChange={(value) => handleConditionValueChange([...keyPath, k, 'conditions', index], value)}
                                    /> :
                                    null
                                }
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    )
                }
              </div>
              <FormRow list={v.get('children')} onShowModal={onShowModal} keyPath={[...keyPath, k, 'children']} />
            </div>
          );
        })
      }
      <div className={'row'} key={'add'}>
        <Button onClick={addRow} icon={<PlusOutlined />} />
      </div>
    </>
  );
};

export { ProcessForm };


