import { app, BrowserWindow } from 'electron';
import path from 'path';
import { startChildProcess } from './remote';

const isDevelopment = process.env.NODE_ENV === 'development';

async function createWindow() {
  const win = new BrowserWindow({
    width: 1020,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      backgroundThrottling: false,
      contextIsolation: false,
    },
    frame: false,
    show: true,
    resizable: false,
    useContentSize: true,
    backgroundColor: '#121212',
  });
  if (isDevelopment) {
    try {
      await win.loadURL('http://127.0.0.1:3333');
    } catch (e) { console.error(e); }
  } else {
    try {
      await win.loadURL(`file:///${path.join(__dirname, '../dist/view/index.html')}`);
    } catch (e) { console.error(e); }
  }
  return win;
}

app.whenReady()
  .then(createWindow)
  .then(startChildProcess);
