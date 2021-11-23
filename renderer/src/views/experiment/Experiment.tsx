import React, { FC, useCallback, useRef, useState } from 'react';
import { CropperData, Picker, PickerInstance } from '../picker/Picker';
import { Button } from 'antd';
import { Link } from 'react-router-dom';
import './index.scss';
import { SnapshotModal, SnapshotModalInstance } from '../snapshot-modal/SnapshotModal';
import { centralEventbus } from '../../helpers/eventbus';

const Experiment: FC = () => {
  const pickerRef = useRef<PickerInstance>();
  const modalRef = useRef<SnapshotModalInstance>();
  const currentRef = useRef(0);
  const [image1, setImage1] = useState<any>();
  const [image2, setImage2] = useState<any>();
  const [compareResult, setCompareResult] = useState<number | null>(null);

  const handlePicker = useCallback((data: CropperData) => {
    centralEventbus.emit('select', data).subscribe(res => {
      if (currentRef.current === 0) {
        setImage1(res.message);
      } else {
        setImage2(res.message);
      }
    });
  }, []);
  const showModal = useCallback((index: number) => {
    currentRef.current = index;
    modalRef.current?.show();
  }, []);
  const compare = useCallback((type = 'absolute') => {
    centralEventbus.emit('experiment-compare', {
      type,
      data1: image1,
      data2: image2,
      ignores: type === 'absolute' ? [] : undefined,
    }).subscribe(res => {
      setCompareResult(res.message);
    });
  }, [image1, image2]);

  return (
    <div className={'experiment'}>
      <div className={'row'}>
        <Button type={'link'}>
          <Link to={'/'} replace>返回首页</Link>
        </Button>
      </div>
      <div className={'images-wrapper'}>
        <div className={'column'}>
          <div className={'select'} onClick={() => showModal(0)}>
            {
              image1?.base64 ?
                <img src={image1.base64} alt="image1"/> :
                null
            }
          </div>
          {
            image1 ?
              <div className={'info'}>
                <p>left：{image1.left}</p>
                <p>top：{image1.top}</p>
                <p>width：{image1.width}</p>
                <p>height：{image1.height}</p>
                <p>lightness：{image1.lightness}</p>
              </div> :
              null
          }
          {
            image1 ?
              <div className={'preview'}>{
                image1.rgb.map((v: any, k: number) => {
                  return (
                    <div style={{ background: `rgb(${v.r},${v.g},${v.b})` }} key={k}/>
                  );
                })
              }</div> :
              null
          }
          {
            image1 ?
              <div className={'preview'}>{
                image1.grayscale.map((v: any, k: number) => {
                  return (
                    <div style={{ background: `rgb(${v},${v},${v})` }} key={k}/>
                  );
                })
              }</div> :
              null
          }
          {
            image1 ?
              <div className={'preview'}>{
                image1.fingerprint.map((v: any, k: number) => {
                  return (
                    <div style={{ background: v > 0 ? '#000' : '#f1f1f1' }} key={k}/>
                  );
                })
              }</div> :
              null
          }
        </div>
        <div className={'column'}>
          <div className={'select'} onClick={() => showModal(1)}>
            {
              image2?.base64 ?
                <img src={image2.base64} alt="image2"/> :
                null
            }
          </div>
          {
            image2 ?
              <div className={'info'}>
                <p>left：{image2.left}</p>
                <p>top：{image2.top}</p>
                <p>width：{image2.width}</p>
                <p>height：{image2.height}</p>
                <p>lightness：{image2.lightness}</p>
              </div> :
              null
          }
          {
            image2 ?
              <div className={'preview'}>{
                image2.rgb.map((v: any, k: number) => {
                  return (
                    <div style={{ background: `rgb(${v.r},${v.g},${v.b})` }} key={k}/>
                  );
                })
              }</div> :
              null
          }
          {
            image2 ?
              <div className={'preview'}>{
                image2.grayscale.map((v: any, k: number) => {
                  return (
                    <div style={{ background: `rgb(${v},${v},${v})` }} key={k}/>
                  );
                })
              }</div> :
              null
          }
          {
            image2 ?
              <div className={'preview'}>{
                image2.fingerprint.map((v: any, k: number) => {
                  return (
                    <div style={{ background: v > 0 ? '#000' : '#f1f1f1' }} key={k}/>
                  );
                })
              }</div> :
              null
          }
        </div>
      </div>
      <div>
        <Button onClick={() => compare('absolute')}>图像对比</Button>
        <Button onClick={() => compare('texture')}>纹理对比</Button>
      </div>
      <div>{compareResult}</div>
      <Picker ref={pickerRef} onSubmit={handlePicker} />
      <SnapshotModal ref={modalRef} onChange={pickerRef.current?.show} />
    </div>
  );
};

export { Experiment };
