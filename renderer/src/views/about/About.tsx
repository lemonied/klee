import React, { FC } from 'react';
import { Button } from 'antd';
import { Link } from 'react-router-dom';

const About: FC = () => {
  return (
    <div className={'about-me'}>
      <p>作者：ChenJiYuan</p>
      <p>邮箱：chenjiyuan.123@qq.com</p>
      <p>QQ：447334358</p>
      <p>github：<a target={'_blank'} rel={'noreferrer'} href="https://github.com/timoodada/klee">https://github.com/timoodada/klee</a></p>
      <Link to={'/'} replace>
        <Button>返回首页</Button>
      </Link>
    </div>
  );
};

export { About };
