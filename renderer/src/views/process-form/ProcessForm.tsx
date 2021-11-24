import React, {
  FC,
  forwardRef,
  useCallback,
  useImperativeHandle,
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
  Checkbox,
  Tag,
} from 'antd';
import {
  FileImageOutlined,
  DragOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { SnapshotModal, SnapshotModalInstance } from '../snapshot-modal/SnapshotModal';
import './index.scss';
import { Picker, PickerInstance } from '../picker/Picker';
import { List, Map, fromJS } from 'immutable';
import { centralEventbus } from '../../helpers/eventbus';
import { combineClassNames } from '../../helpers/utils';
import { keyboardMap } from './keyboard';
import { ReactSortable } from 'react-sortablejs';
import { randomStr } from '../../helpers/utils';
import { CheckboxChangeEvent } from 'antd/es/checkbox';
import { Conditions, CropperData, Ignores, ProcessList } from '../../models';

const { Option } = Select;

interface Props {
  disabled?: boolean;
  list: ProcessList;
  setList: (value: ProcessList) => void;
}
const ProcessForm: FC<Props> = (props) => {

  const { disabled, list, setList } = props;
  const listRef = useRef<any[]>();
  const pickerTypeRef = useRef('normal');

  const modalRef = useRef<SnapshotModalInstance>();
  const pickerRef = useRef<PickerInstance>();

  const onPicked = useCallback((data: CropperData) => {
    if (pickerTypeRef.current === 'normal') {
      centralEventbus.emit('select', data).subscribe((res) => {
        const crop = res.message;
        let target = list.setIn(
          [...listRef.current!, 'crop'],
          Map(crop),
        );
        const conditions = target.getIn([...listRef.current!, 'conditions']) as Conditions;
        const index = conditions?.findIndex(v => v.get('type') === 'lightness');
        if (index > -1) {
          target = target.setIn(
            [...listRef.current!, 'conditions', index, 'value'],
            crop.lightness,
          );
        } else if (!conditions) {
          target = target.setIn(
            [...listRef.current!, 'conditions'],
            fromJS([{ type: 'lightness', value: crop.lightness, size: 'more' }]),
          );
        }
        setList(target);
      });
    } else if (pickerTypeRef.current === 'area') {
      setList(
        list.setIn(
          [...listRef.current!, 'area'],
          Map({ left: data.left, top: data.top, width: data.width, height: data.height }),
        ),
      );
    }
  }, [list, setList]);

  const showModal = useCallback((arr: any[], type = 'normal') => {
    pickerTypeRef.current = type;
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
          originList={list}
          setList={setList}
        />
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
  list: ProcessList;
  originList: ProcessList;
  setList: (value: ProcessList) => void;
  keyPath?: any[];
  onShowModal?(keyPath: any[], type?: string): void;
  disabled?: boolean;
  level?: number;
}
const FormRow = forwardRef<FormRowInstance, FormRowProps>((props, ref) => {
  const { keyPath = [], list, onShowModal, disabled, level = 1, originList, setList } = props;
  const handleShowModal = useCallback((key: number) => {
    if (typeof onShowModal === 'function') {
      onShowModal([...keyPath, key]);
    }
  }, [keyPath, onShowModal]);
  const initRow = useCallback((type: string, index: number | string) => {
    const row = {
      id: typeof index === 'number' ? randomStr(index, 6) : index,
      type,
      available: true,
    };
    if (type === 'general') {
      Object.assign(row, {
        key: '',
        keydown: 5,
        keyup: 5,
      });
    } else if (type === 'picker') {
      Object.assign(row, {
        otherwise: false,
        children: List<any>([]),
      });
    } else {
      Object.assign(row, {
        value: 50,
      });
    }
    return Map(row);
  }, []);
  const addRow = useCallback(() => {
    setList(originList.updateIn(keyPath, (value: any) => {
      return value.push(initRow('general', value.size));
    }));
  }, [initRow, keyPath, originList, setList]);
  const handleTypeChange = useCallback((index: number, value: string) => {
    setList(originList.updateIn([...keyPath, index], (uploader: any) => initRow(value, uploader.get('id'))));
  }, [initRow, keyPath, originList, setList]);
  // 条件类型
  const handleConditionChange = useCallback((keyPath: any[], value: string) => {
    let target = originList;
    target = target.deleteIn([...keyPath.slice(0, -1), 'area']);
    target = target.setIn([...keyPath, 'type'], value);
    switch (value) {
      case 'lightness':
        target = target.setIn([...keyPath, 'value'], target.getIn([...keyPath.slice(0, -2), ...['crop', 'lightness']]) || 0);
        break;
      case 'texture':
        target = target.setIn([...keyPath, 'value'], 70);
        break;
      case 'absolute':
        target = target.setIn([...keyPath, 'value'], 96);
        break;
      default:
    }
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
  const handleValueChange = useCallback((keyPath: any[], value: any) => {
    let target = originList;
    target = target.setIn([...keyPath, 'value'], value);
    setList(target);
  }, [originList, setList]);
  // if else
  const handleElseChange = useCallback((keyPath: any[], event: CheckboxChangeEvent) => {
    let target = originList;
    target = target.setIn([...keyPath, 'otherwise'], event.target.checked);
    setList(target);
  }, [originList, setList]);
  const handleAvailableChange = useCallback((keyPath: any[], event: CheckboxChangeEvent) => {
    let target = originList;
    target = target.setIn([...keyPath, 'available'], event.target.checked);
    setList(target);
  }, [originList, setList]);
  const handleDeleteRow = useCallback((keyPath: any[]) => {
    setList(originList.deleteIn(keyPath));
  }, [originList, setList]);
  const handleSelectArea = useCallback((index: number) => {
    if (typeof onShowModal === 'function') {
      onShowModal([...keyPath, index], 'area');
    }
  }, [keyPath, onShowModal]);
  const handleDeleteArea = useCallback((index: number) => {
    setList(originList.deleteIn([...keyPath, index, 'area']));
  }, [keyPath, originList, setList]);
  const handleIgnoreLightness = useCallback((keyPath: any[], e: CheckboxChangeEvent) => {
    const ignores = originList.getIn([...keyPath, 'ignores']) as Ignores;
    const index = ignores?.indexOf('v');
    if (index > -1) {
      setList(originList.deleteIn([...keyPath, 'ignores', index]));
    } else if (ignores) {
      setList(originList.updateIn([...keyPath, 'ignores'], (updater: any) => updater.push('v')));
    } else {
      setList(originList.setIn([...keyPath, 'ignores'], List(['v'])));
    }
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
    <div
      className={`form-level form-level-${level % 2 === 1 ? 'odd' : 'even'}`}
    >
      <div
        className={'form-level-content'}
      >
        {
          list.size > 0 ? (
            <ReactSortable
              setList={setSortableList}
              list={sortableList}
              animation={200}
              tag={'div'}
              handle={`.sortable-handle-${level}`}
              className={'form-row-wrapper'}
            >
              {
                list.map((v, k) => {
                  return (
                    <div className={'row line-space'} key={v.get('id')}>
                      <div className={'line line-space'}>
                        <DragOutlined className={`sortable-handle sortable-handle-${level}`} />
                        <Select
                          defaultValue={v.get('type')}
                          onChange={(e) => handleTypeChange(k, e)}
                          disabled={disabled}
                        >
                          <Option value="general">按键</Option>
                          <Option value="picker">取色</Option>
                          <Option value="timeout">延时</Option>
                        </Select>
                        {
                          (() => {
                            switch (v.get('type')) {
                              case 'general':
                                return (
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
                                );
                              case 'picker':
                                return (
                                  <div className={'flex-align-center line-space'}>
                                    <span className={'conditional-text'}>if</span>
                                    <div
                                      onClick={() => !disabled && handleShowModal(k)}
                                      className={combineClassNames('snapshot link')}
                                    >
                                      {
                                        v.get('crop') ?
                                          (
                                            <Tooltip
                                              title={
                                                <>
                                                  <div>{`id：${v.getIn(['crop', 'id'])}`}</div>
                                                  <div>{`left：${v.getIn(['crop', 'left'])}`}</div>
                                                  <div>{`top：${v.getIn(['crop', 'top'])}`}</div>
                                                  <div>{`width：${v.getIn(['crop', 'width'])}`}</div>
                                                  <div>{`height：${v.getIn(['crop', 'height'])}`}</div>
                                                  <div>{`明亮度：${v.getIn(['crop', 'lightness'])}`}</div>
                                                </>
                                              }
                                            >
                                              <img src={v.getIn(['crop', 'base64']) as string} alt="snapshot"/>
                                            </Tooltip>
                                          ) :
                                          (
                                            <Avatar
                                              size={'large'}
                                              shape={'square'}
                                              icon={<FileImageOutlined />}
                                            />
                                          )
                                      }
                                    </div>
                                    <div className={'flex-align-center line-space'}>
                                      {
                                        v.get('conditions')?.map((condition, index) => (
                                          <div className={'condition line-space'} key={index}>
                                            <Select
                                              disabled={disabled}
                                              value={condition.get('type')}
                                              onChange={(e) => handleConditionChange([...keyPath, k, 'conditions', index], e)}
                                              style={{ minWidth: 100 }}
                                            >
                                              <Option value="lightness">明亮度</Option>
                                              <Option value="texture">纹理相似度</Option>
                                              <Option value="absolute">完全相似度</Option>
                                            </Select>
                                            <Select
                                              disabled={disabled}
                                              value={condition.get('size')}
                                              onChange={(e) => handleSizeJudgment([...keyPath, k, 'conditions', index], e)}
                                            >
                                              <Option value="more">大于</Option>
                                              <Option value="less">小于</Option>
                                            </Select>
                                            {
                                              (() => {
                                                switch (condition.get('type')) {
                                                  case 'lightness':
                                                    return (
                                                      <Tooltip
                                                        title={'明亮度是指该裁剪区域的平均亮度，取值范围 0 ~ 1。'}
                                                      >
                                                        <InputNumber
                                                          disabled={disabled}
                                                          min={0}
                                                          max={1}
                                                          step={0.0001}
                                                          value={condition.get('value')}
                                                          onChange={(value) => handleConditionValueChange([...keyPath, k, 'conditions', index], value)}
                                                        />
                                                      </Tooltip>
                                                    );
                                                  case 'texture':
                                                    return (
                                                      <>
                                                        <Tooltip
                                                          title={'纹理相似度是将灰度化后（忽略色彩）的图片进行对比，一般当相似度大于70%时，则认为两张图片相似'}
                                                        >
                                                          <InputNumber
                                                            disabled={disabled}
                                                            style={{ width: 150 }}
                                                            min={0}
                                                            max={100}
                                                            step={1}
                                                            value={condition.get('value')}
                                                            onChange={(value) => handleConditionValueChange([...keyPath, k, 'conditions', index], value)}
                                                            addonAfter={'%'}
                                                          />
                                                        </Tooltip>
                                                      </>
                                                    );
                                                  case 'absolute':
                                                    return (
                                                      <>
                                                        <Tooltip
                                                          title={'完全相似度是将图片的颜色通道进行完全对比'}
                                                        >
                                                          <InputNumber
                                                            disabled={disabled}
                                                            style={{ width: 150 }}
                                                            min={0}
                                                            max={100}
                                                            step={1}
                                                            value={condition.get('value')}
                                                            onChange={(value) => handleConditionValueChange([...keyPath, k, 'conditions', index], value)}
                                                            addonAfter={'%'}
                                                          />
                                                        </Tooltip>
                                                        {
                                                          v.get('area') ?
                                                            (
                                                              <Tooltip
                                                                title={(
                                                                  <>
                                                                    <div>{`left：${v.getIn(['area', 'left'])}`}</div>
                                                                    <div>{`top：${v.getIn(['area', 'top'])}`}</div>
                                                                    <div>{`width：${v.getIn(['area', 'width'])}`}</div>
                                                                    <div>{`height：${v.getIn(['area', 'height'])}`}</div>
                                                                  </>
                                                                )}>
                                                                <Tag color="magenta" closable={!disabled} onClose={() => handleDeleteArea(k)}>已选择区域</Tag>
                                                              </Tooltip>
                                                            ) :
                                                            (
                                                              <Tooltip
                                                                title={'选择区域后，将在该区域内搜索图标，会有一定的性能消耗；不选择区域则在原图标位置进行图像比对。'}
                                                              >
                                                                <Button disabled={disabled} size={'small'} onClick={() => handleSelectArea(k)}>选择区域</Button>
                                                              </Tooltip>
                                                            )
                                                        }
                                                        <Checkbox
                                                          checked={condition.get('ignores')?.includes('v')}
                                                          onChange={e => handleIgnoreLightness([...keyPath, k, 'conditions', index], e)}
                                                        >忽略亮度</Checkbox>
                                                      </>
                                                    );
                                                  default:
                                                    return null;
                                                }
                                              })()
                                            }
                                          </div>
                                        ))
                                      }
                                      {
                                        v.get('conditions') && (
                                          <Tooltip
                                            title={'勾选后，当前层级的下一个流程将执行else逻辑'}
                                          >
                                            <Checkbox
                                              disabled={disabled}
                                              checked={v.get('otherwise')}
                                              onChange={value => handleElseChange([...keyPath, k], value)}
                                            >
                                              <span className={'conditional-text'}>else</span>
                                            </Checkbox>
                                          </Tooltip>
                                        )
                                      }
                                    </div>
                                  </div>
                                );
                              default:
                                return (
                                  <InputNumber
                                    disabled={disabled}
                                    min={50}
                                    step={1}
                                    addonAfter={'毫秒'}
                                    value={v.get('value')}
                                    onChange={(value) => handleValueChange([...keyPath, k], value)}
                                  />
                                );
                            }
                          })()
                        }
                        <Tooltip
                          title={'启用该流程'}
                        >
                          <div style={{ paddingTop: 4 }}>
                            <Checkbox
                              disabled={disabled}
                              checked={v.get('available')}
                              onChange={value => handleAvailableChange([...keyPath, k], value)}
                            >
                              <span>启用</span>
                            </Checkbox>
                          </div>
                        </Tooltip>
                        {
                          disabled ?
                            null :
                            (
                              <DeleteOutlined
                                className={'delete-row'}
                                onClick={() => handleDeleteRow([...keyPath, k])}
                              />
                            )
                        }
                      </div>
                      {
                        v.get('children') && (
                          <FormRow
                            level={level + 1}
                            list={v.get('children')}
                            disabled={disabled}
                            onShowModal={onShowModal}
                            keyPath={[...keyPath, k, 'children']}
                            originList={originList}
                            setList={setList}
                          />
                        )
                      }
                    </div>
                  );
                })
              }
            </ReactSortable>
          ) : null
        }
        {
          disabled ?
            null :
            (
              <div className={'add-row'}>
                <Button onClick={addRow} type={'dashed'} block size={'small'}>添加流程</Button>
              </div>
            )
        }
      </div>
    </div>
  );
});

export { ProcessForm };


