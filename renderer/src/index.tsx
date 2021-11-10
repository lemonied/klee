import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { HashRouter } from 'react-router-dom';
import zhCN from 'antd/lib/locale/zh_CN';
import './common/styles/index.scss';
import { ConfigProvider } from 'antd';
import { store } from './store';
import { Provider } from 'react-redux';

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <HashRouter>
        <ConfigProvider locale={zhCN}>
          <App />
        </ConfigProvider>
      </HashRouter>
    </Provider>
  </React.StrictMode>,
  document.getElementById('root'),
);
