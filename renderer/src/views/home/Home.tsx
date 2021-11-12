import React, { FC, useCallback, useRef, useState } from 'react';
import {
  Button,
  Avatar,
} from 'antd';
import {
  FileImageOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { SnapshotModal, SnapshotModalInstance } from '../snapshot-modal/SnapshotModal';
import './index.scss';
import { Picker, PickerInstance, CropperData } from '../picker/Picker';
import { List, Map } from 'immutable';
import { centralEventBus } from '../../helpers/eventbus';

interface ItemMap {
  crop: CropperData;
}

type ItemKey = keyof ItemMap;

type ListItem = Map<ItemKey, ItemMap[ItemKey]>;

const Home: FC = () => {

  const [list, setList] = useState<List<ListItem>>(List([]));
  const listRef = useRef<number[]>();

  const modalRef = useRef<SnapshotModalInstance>();
  const pickerRef = useRef<PickerInstance>();

  const addRow = useCallback(() => {
    setList((prev) => prev.push(Map({} as ItemMap)));
  }, []);

  const onPicked = useCallback((data: CropperData) => {
    setList((prev) => prev.setIn(listRef.current!, data));
    centralEventBus.emit('select', data.id);
  }, []);

  const showModal = useCallback((arr: any[]) => {
    listRef.current = arr;
    modalRef.current?.show();
  }, []);

  return (
    <>
      <div className={'home'}>
        <p>
          <Link to={'/about'}>
            <Button>关于</Button>
          </Link>
        </p>
        <div className={'form'}>
          {
            list.map((v, k) => {
              return (
                <div className={'row'} key={k}>
                  <span onClick={() => showModal([k, 'crop'])} className={'snapshot link'}>
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
                  </span>
                </div>
              );
            })
          }
          <div className={'row'}>
            <Button onClick={addRow} icon={<PlusOutlined />} />
          </div>
        </div>
      </div>
      <SnapshotModal ref={modalRef} onChange={pickerRef.current?.show} />
      <Picker onSubmit={onPicked} ref={pickerRef} />
    </>
  );
};

export { Home };
