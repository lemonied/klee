import React, { FC, useEffect, useState } from 'react';
import { centralEventBus } from './helpers/eventbus';
import './App.scss';
import { Layout, Header } from './components';

const App: FC = () => {
  const [base64, setBase64] = useState<string>();
  useEffect(() => {
    const subscription = centralEventBus.on('screenshot').subscribe(res => {
      setBase64(res.message);
    });
    return () => subscription.unsubscribe();
  }, []);
  return (
    <Layout
      className={'root-app'}
      header={<Header />}
      fixed={true}
    >
      <img src={`data:image/png;base64,${base64}`} alt=""/>
    </Layout>
  );
};

export default App;
