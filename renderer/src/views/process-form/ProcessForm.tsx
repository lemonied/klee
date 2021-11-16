import React, {
  FC, forwardRef,
  useCallback, useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import {
  Button,
  Avatar,
  Select,
  InputNumber,
  AutoComplete,
  Tooltip,
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
import { average, combineClassNames } from '../../helpers/utils';
import { keyboardMap } from './keyboard';
import { ReactSortable } from 'react-sortablejs';
import { randomStr } from '../../helpers/utils';

const { Option } = Select;

interface Props {
  disabled?: boolean;
}
const ProcessForm: FC<Props> = (props) => {

  const { disabled } = props;
  const [list, setList] = useProcessList();
  const listRef = useRef<any[]>();

  const modalRef = useRef<SnapshotModalInstance>();
  const pickerRef = useRef<PickerInstance>();
  const formRowRef = useRef<FormRowInstance>(null);

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
          disabled={disabled}
          ref={formRowRef}
        />
        <div className={'row'}>
          <Button onClick={() => formRowRef.current?.addRow()} icon={<PlusOutlined />} />
        </div>
      </div>
      <SnapshotModal ref={modalRef} onChange={pickerRef.current?.show} />
      <Picker onSubmit={onPicked} ref={pickerRef} />
    </>
  );
};

interface FormRowInstance {
  addRow(): void;
}
interface FormRowProps {
  list: List<any>;
  keyPath?: any[];
  onShowModal?(keyPath: any[]): void;
  disabled?: boolean;
}
const FormRow = forwardRef<FormRowInstance, FormRowProps>((props, ref) => {
  const { keyPath = [], list, onShowModal, disabled } = props;
  const [originList, setList] = useProcessList();
  const handleShowModal = useCallback((key: number) => {
    if (typeof onShowModal === 'function') {
      onShowModal([...keyPath, key]);
    }
  }, [keyPath, onShowModal]);
  const initRow = useCallback((type: string) => {
    const row = {
      id: randomStr('process_row'),
      type,
    };
    if (type === 'general') {
      Object.assign(row, {
        key: '',
        keydown: 5,
        keyup: 5,
      });
    } else if (type === 'picker') {
      Object.assign(row, {
        children: List<any>([]),
      });
    } else {
      Object.assign(row, {
        value: 0,
      });
    }
    return Map(row);
  }, []);
  const addRow = useCallback(() => {
    setList(originList.updateIn(keyPath, (value: any) => {
      return value.push(initRow('general'));
    }));
  }, [initRow, keyPath, originList, setList]);
  const handleTypeChange = useCallback((path: any[], value: string) => {
    setList(originList.updateIn(path, () => initRow(value)));
  }, [initRow, originList, setList]);
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
  const sortableList = useMemo(() => {
    return list.toJS() as any[];
  }, [list]);
  const setSortableList = useCallback((sList: any[]) => {
    setList(
      originList.updateIn(keyPath, () => fromJS(sList)),
    );
  }, [setList, originList, keyPath]);

  useImperativeHandle(ref, () => {
    return { addRow };
  });
  
  return (
    <>
      <ReactSortable
        setList={setSortableList}
        list={sortableList}
        group={'process-list'}
        animation={200}
      >
        {
          list.map((v, k) => {
            return (
              <div className={'row'} key={v.id}>
                <div className={'line line-space'}>
                  <Select
                    defaultValue={v.get('type')}
                    onChange={(e) => handleTypeChange([...keyPath, k], e)}
                    disabled={disabled}
                  >
                    <Option value="general">按键</Option>
                    <Option value="picker">取色</Option>
                  </Select>
                  {
                    v.get('type') === 'general' ?
                      (
                        <div className={'flex-align-center line-space'}>
                          <AutoComplete
                            disabled={disabled}
                            placeholder={'输入按键'}
                            value={v.get('key')}
                            onChange={(e) => handleKeyChange([...keyPath, k], e)}
                            style={{ width: 150 }}
                            options={getKeyOptions([...keyPath, k, 'key'])}
                          />
                          <Tooltip title={`按下延迟，${v.get('keydown')}毫秒后按下${v.get('key')}`}>
                            <InputNumber
                              disabled={disabled}
                              min={0}
                              step={1}
                              value={v.get('keydown')}
                              addonAfter={'毫秒'}
                              style={{ width: 150 }}
                              onChange={(value) => handleKeydown([...keyPath, k], value)}
                            />
                          </Tooltip>
                          <Tooltip title={`抬起延迟，${v.get('keyup')}毫秒后抬起${v.get('key')}`}>
                            <InputNumber
                              disabled={disabled}
                              min={0}
                              step={1}
                              value={v.get('keyup')}
                              addonAfter={'毫秒'}
                              style={{ width: 150 }}
                              onChange={(value) => handleKeyup([...keyPath, k], value)}
                            />
                          </Tooltip>
                        </div>
                      ) :
                      (
                        <div className={'flex-align-center line-space'}>
                          <span>if</span>
                          <div onClick={() => !disabled && handleShowModal(k)} className={combineClassNames('snapshot link', disabled ? 'disabled' : null)}>
                            {
                              v.get('crop') ?
                                <img src={v.get('crop')?.base64} alt="snapshot"/> :
                                <Avatar
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
                                    disabled={disabled}
                                    defaultValue={condition.get('type')}
                                    onChange={(e) => handleConditionChange([...keyPath, k, 'conditions', index], e)}
                                    style={{ minWidth: 100 }}
                                  >
                                    <Option value="lightness">明亮度</Option>
                                    <Option value="texture">纹理相似度</Option>
                                    <Option value="absolute">完全相似度</Option>
                                  </Select>
                                  <Select
                                    disabled={disabled}
                                    defaultValue={condition.get('size')}
                                    onChange={(e) => handleSizeJudgment([...keyPath, k, 'conditions', index], e)}
                                  >
                                    <Option value="more">大于</Option>
                                    <Option value="less">小于</Option>
                                  </Select>
                                  {
                                    condition.get('type') === 'lightness' ?
                                      <InputNumber
                                        disabled={disabled}
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
                {
                  v.get('children') && (
                    <FormRow list={v.get('children')} disabled={disabled} onShowModal={onShowModal} keyPath={[...keyPath, k, 'children']} />
                  )
                }
              </div>
            );
          })
        }
      </ReactSortable>
    </>
  );
});

export { ProcessForm };


