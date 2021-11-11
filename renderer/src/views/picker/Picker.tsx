import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { useSnapshot } from './snapshot';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';
import './index.scss';
import { Button } from 'antd';
import { centralEventBus } from '../../helpers/eventbus';
import { Subscription } from 'rxjs';

interface Props {

}

export interface PickerInstance {
  show(): void;
  hide(): void;
}

const Picker = forwardRef<PickerInstance | undefined, Props>((props, ref) => {
  const snapshot = useSnapshot();
  const [visible, setVisible] = useState(false);
  const cropperRef = useRef<Cropper>();
  const imageRef = useRef<HTMLImageElement>(null);

  const handleUrlChange = useCallback((url: string) => {
    if (cropperRef.current) {
      cropperRef.current?.replace(`data:image/png;base64,${url}`);
    } else if (imageRef.current) {
      cropperRef.current = new Cropper(imageRef.current!, {
        viewMode: 1,
        dragMode: 'move',
        toggleDragModeOnDblclick: false,
        minCanvasWidth: imageRef.current!.clientWidth,
        minCanvasHeight: imageRef.current!.clientHeight,
        minCropBoxWidth: 50,
        minCropBoxHeight: 50,
      });
    }
  }, []);

  useEffect(() => {
    if (snapshot) {
      setTimeout(() => {
        handleUrlChange(snapshot.base64);
      });
    }
  }, [snapshot, handleUrlChange]);

  useEffect(() => {
    if (!visible) {
      cropperRef.current?.destroy();
      cropperRef.current = undefined;
    }
  }, [visible]);

  useEffect(() => {
    return () => {
      cropperRef.current?.destroy();
      cropperRef.current = undefined;
    };
  }, []);

  useEffect(() => {
    let subscription: Subscription;
    if (visible) {
      subscription = centralEventBus.on('screenshot').subscribe((res) => {
        centralEventBus.emit('focus');
      });
    }
    return () => subscription?.unsubscribe();
  }, [visible]);

  const submit = useCallback(() => {
    setVisible(false);
  }, []);

  const getCroppedData = useCallback(() => {
    const cropper = cropperRef.current;
    if (cropper) {
      const canvas = cropper.getCroppedCanvas();
      const crop  = cropper.getCropBoxData();
      return {
        base64: canvas.toDataURL('image/png', 1),
        width: crop.width,
        height: crop.height,
        left: crop.left,
        top: crop.top,
      };
    }
    return null;
  }, []);

  const preview = useCallback(() => {
    const data = getCroppedData();
    // eslint-disable-next-line no-console
    console.log(data);
  }, [getCroppedData]);

  const minimize = useCallback(() => {
    centralEventBus.emit('minimize');
  }, []);

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
    <div className={'snapshot-picker'}>
      <div className={'picker-content'}>
        {
          snapshot ?
            <img className={'origin-image'} ref={imageRef} src={`data:image/png;base64,${snapshot.base64}`} alt={'snapshot'}/> :
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
            <span>也可以从<Button onClick={minimize} size={'small'} type={'link'}>历史记录</Button>中选择；</span>
          </p>
        </div>
        <div className={'right'}>
          <Button onClick={submit} type={'primary'}>完成</Button>
        </div>
      </div>
    </div>
  );
});

export { Picker };
