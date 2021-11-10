import React, {
  useState,
  forwardRef, useImperativeHandle,
} from 'react';
import { useSnapshot } from './snapshot';
import './index.scss';

interface Props {

}

export interface PickerInstance {
  show(): void;
  hide(): void;
}

const Picker = forwardRef<PickerInstance | undefined, Props>((props, ref) => {
  const snapshot = useSnapshot();
  const [visible, setVisible] = useState(false);

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
      {
        snapshot ?
          <img src={`data:image/png;base64,${snapshot}`} alt="snapshot"/> :
          null
      }
    </div>
  );
});

export { Picker };
