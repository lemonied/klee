import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { HashRouter } from 'react-router-dom';
import zhCN from 'antd/lib/locale/zh_CN';
import './common/styles/index.scss';
import { ConfigProvider } from 'antd';

ReactDOM.render(
  <React.StrictMode>
    <HashRouter>
      <ConfigProvider locale={zhCN}>
        <App />
      </ConfigProvider>
    </HashRouter>
  </React.StrictMode>,
  document.getElementById('root'),
);
