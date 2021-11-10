import React, { FC } from 'react';
import { useSnapshot } from './snapshot';

const Picker: FC = () => {
  const snapshot = useSnapshot();
  return (
    <div>
      {
        snapshot ?
          <img src={`data:image/png;base64,${snapshot}`} alt=""/> :
          null
      }
    </div>
  );
};

export { Picker };
