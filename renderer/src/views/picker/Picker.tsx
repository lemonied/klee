import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { Snapshot, useSnapshot, useSnapshotsHistory } from './snapshot';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';
import './index.scss';
import { Button, Modal } from 'antd';
import { centralEventbus } from '../../helpers/eventbus';
import { Subscription } from 'rxjs';
import { CropperData } from '../../models';

interface Props {
  onSubmit?(data: CropperData): void;
}

export interface PickerInstance {
  show(): void;
  hide(): void;
}

const DEFAULT_CROP_DATA = {
  width: 200,
  height: 200,
};

const Picker = forwardRef<PickerInstance | undefined, Props>((props, ref) => {
  const { onSubmit } = props;

  const [snapshot, setSnapshot] = useSnapshot();
  const [historySnapshots] = useSnapshotsHistory();
  const [visible, setVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [cropperData, setCropperData] = useState<CropperData | null>(null);
  const cropperRef = useRef<Cropper>();
  const imageRef = useRef<HTMLImageElement>(null);

  const handleUrlChange = useCallback((url: string) => {
    if (cropperRef.current) {
      cropperRef.current?.replace(`${url}`);
    } else if (imageRef.current) {
      cropperRef.current = new Cropper(imageRef.current!, {
        viewMode: 1,
        dragMode: 'move',
        toggleDragModeOnDblclick: false,
        minCanvasWidth: imageRef.current!.clientWidth,
        minCanvasHeight: imageRef.current!.clientHeight,
        minCropBoxWidth: 50,
        minCropBoxHeight: 50,
        data: DEFAULT_CROP_DATA,
        ready(event: Cropper.ReadyEvent<HTMLImageElement>) {
          cropperRef.current?.setData(DEFAULT_CROP_DATA);
        },
      });
    }
  }, []);

  useEffect(() => {
    if (snapshot && visible) {
      setTimeout(() => {
        handleUrlChange(snapshot.base64);
      });
    } else if (!visible) {
      cropperRef.current?.destroy();
      cropperRef.current = undefined;
    }
  }, [snapshot, handleUrlChange, visible]);

  useEffect(() => {
    return () => {
      cropperRef.current?.destroy();
      cropperRef.current = undefined;
    };
  }, []);

  useEffect(() => {
    let subscription: Subscription;
    if (visible) {
      subscription = centralEventbus.on('screenshot').subscribe((res) => {
        centralEventbus.emit('focus');
      });
    }
    return () => subscription?.unsubscribe();
  }, [visible]);

  const getCroppedData = useCallback<() => CropperData | null>(() => {
    const cropper = cropperRef.current;
    if (cropper) {
      const canvas = cropper.getCroppedCanvas();
      const crop  = cropper.getData();
      return {
        id: snapshot!.id,
        base64: canvas.toDataURL('image/png', 1),
        width: Math.floor(crop.width),
        height: Math.floor(crop.height),
        left: Math.floor(crop.x),
        top: Math.floor(crop.y),
      };
    }
    return null;
  }, [snapshot]);

  const submit = useCallback(() => {
    setVisible(false);
    if (typeof onSubmit === 'function') {
      const data = getCroppedData();
      if (data) {
        onSubmit(data);
      }
    }
  }, [onSubmit, getCroppedData]);

  const preview = useCallback(() => {
    const data = getCroppedData();
    setCropperData(data);
    setPreviewVisible(true);
  }, [getCroppedData]);

  const minimize = useCallback(() => {
    centralEventbus.emit('minimize');
  }, []);

  const handleHistorySelected = useCallback((screenshot: Snapshot) => {
    setSnapshot(screenshot);
    setHistoryVisible(false);
  }, [setSnapshot]);

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

  if (!visible) {
    return null;
  }
  return (
    <>
      <div className={'snapshot-picker'}>
        <div className={'picker-content'}>
          {
            snapshot ?
              <img className={'origin-image'} ref={imageRef} src={`${snapshot.base64}`} alt={'snapshot'}/> :
              null
          }
        </div>
        <div className={'picker-footer'}>
          <div className={'left'}>
            <Button onClick={() => setVisible(false)}>取消</Button>
          </div>
          <div className={'middle'}>
            <p>
              <span>请使用以上选择框框选技能图标（图片和选择框均可缩放、拖拽），然后点击完成，</span>
              <span>你也可以在点击完成前<Button onClick={preview} type={'link'} size={'small'}>预览</Button>来查看框选结果；</span>
              <span>或者<Button onClick={minimize} size={'small'} type={'link'}>最小化窗口</Button>后，重新截图；</span>
              <span>也可以从<Button onClick={() => setHistoryVisible(true)} size={'small'} type={'link'}>历史记录</Button>中选择；</span>
            </p>
          </div>
          <div className={'right'}>
            <Button onClick={submit} type={'primary'}>完成</Button>
          </div>
        </div>
      </div>
      <Modal
        title={null}
        visible={previewVisible}
        closable={false}
        footer={null}
        className={'picker-preview-modal'}
        bodyStyle={{padding: 0}}
      >
        {
          cropperData && (
            <div className={'content'}>
              <h2>预览</h2>
              <div className={'image'}>
                <img src={cropperData.base64} alt="preview"/>
              </div>
              <p>
                <span>x：{cropperData.left}</span>
                <span>y：{cropperData.top}</span>
                <span>width：{cropperData.width}</span>
                <span>height：{cropperData.height}</span>
              </p>
            </div>
          )
        }
        <div className={'footer'}>
          <Button
            block
            type={'text'}
            size={'large'}
            onClick={() => setPreviewVisible(false)}
          >关闭</Button>
        </div>
      </Modal>
      <Modal
        title={'历史记录'}
        visible={historyVisible}
        closable={true}
        onCancel={() => setHistoryVisible(false)}
        footer={null}
        className={'picker-history-modal'}
        bodyStyle={{padding: 0}}
      >
        <div className={'history-list'}>
          {
            historySnapshots.map(v => {
              return (
                <div className={'img'} key={v.id}>
                  <img onClick={() => handleHistorySelected(v)} src={`${v.base64}`} alt="history"/>
                  <p className={'time'}>{ new Date(v.timestamp).toLocaleString() }</p>
                </div>
              );
            })
          }
        </div>
      </Modal>
    </>
  );
});

export { Picker };
