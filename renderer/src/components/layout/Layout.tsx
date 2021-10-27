import React, { FC, ReactNode } from 'react';
import { combineClassNames } from '../../helpers/utils';
import './Layout.scss';

interface Props {
  header?: ReactNode;
  fixed?: boolean;
  className?: string;
  contentClassName?: string;
}
const Layout: FC<Props> = (props) => {
  const { header, fixed = false, className, children, contentClassName } = props;
  return (
    <div className={combineClassNames('klee-layout', fixed ? 'klee-fixed-header' : null, className)}>
      {
        header ?
          <header className={'klee-layout-header'}>{ header }</header> :
          null
      }
      <div className={combineClassNames('klee-layout-content', contentClassName)}>{children}</div>
    </div>
  );
};

export { Layout };
