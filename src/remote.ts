import { processor } from './processor';
import { globalShortcut, app, BrowserWindow, shell } from 'electron';
import { centralEventbus } from './utils/eventbus';
import { tap } from 'rxjs';
import { CropData } from './models';
import { cutPicture, grayscale, rgb2hsv, average, lightness } from './utils/math';

function onScreenshot() {
  const snapshot = processor.screenshot();
  centralEventbus.emit('screenshot', {
    id: snapshot.id,
    timestamp: snapshot.timestamp,
    base64: snapshot.dataURL,
  });
}

function remoteListener() {
  centralEventbus.on('select').subscribe((e) => {
    const crop = e.message as CropData;
    const image = processor.getHistory(crop);
    if (image) {
      try {
        const rgb = cutPicture(crop, image.bitmap);
        const hsv = rgb2hsv(rgb);
        const grayScale = grayscale(rgb)
        const imageData = {
          rgb,
          grayscale: grayScale,
          hsv,
          lightness: parseFloat(lightness(rgb).toFixed(4)),
        };
        Object.assign(crop, imageData);
        e.event.reply('select-reply', crop);
      } catch (error) {
        e.event.reply('select-reply', 'error');
      }
    } else {
      e.event.reply('select-reply', 'error');
    }
  });
  centralEventbus.on('process-list').subscribe((e) => {
    try {
      processor.setProcessList(e.message);
      e.event.reply('process-list-reply', 'success');
    } catch (error) {
      e.event.reply('process-list-reply', 'error');
    }
  });
  centralEventbus.on('start-process').subscribe((e) => {
    try {
      processor.setAndStartListen(e.message);
      e.event.reply('start-process-reply', 'success');
    } catch (error) {
      e.event.reply('start-process-reply', 'error');
    }
  });
  centralEventbus.on('stop-process').subscribe(async (e) => {
    try {
      await processor.cancelMouseListener();
      e.event.reply('stop-process-reply', 'success');
    } catch (error) {
      e.event.reply('stop-process-reply', 'error');
    }
  });
  centralEventbus.on('log-on').subscribe(() => {
    processor.logAble = true;
  });
  centralEventbus.on('log-off').subscribe(() => {
    processor.logAble = false;
  });
  centralEventbus.on('trigger-type').subscribe((e) => {
    processor.config.type = e.message;
  });
  centralEventbus.on('trigger-button').subscribe((e) => {
    processor.config.button = Number(e.message);
  });
  centralEventbus.on('snapshot-timeout').subscribe((e) => {
    processor.config.workerDelay = e.message;
  });
  centralEventbus.on('listener-config').subscribe((e) => {
    Object.assign(processor.config, e.message);
  });
}

function onWindowOperator(win: BrowserWindow) {
  centralEventbus.on('focus').pipe(
    tap(() => win.focus()),
  ).subscribe();
  centralEventbus.on('hide').pipe(
    tap(() => win.hide()),
  ).subscribe();
  centralEventbus.on('minimize').pipe(
    tap(() => win.minimize()),
  ).subscribe();
  centralEventbus.on('close').pipe(
    tap(() => win.close()),
  ).subscribe();
  centralEventbus.on('maximize').pipe(
    tap(() => win.maximize()),
  ).subscribe();
  centralEventbus.on('unmaximize').pipe(
    tap(() => win.unmaximize()),
  ).subscribe();
  win.webContents.addListener('before-input-event', async (e, input) => {
    if (input.type === 'keyDown' && input.code === 'F5') {
      win.reload();
      processor.logAble = false;
      await processor.cancelMouseListener();
    }
    if (input.type === 'keyDown' && input.code === 'F12') {
      win.webContents.openDevTools();
    }
  });
}

export function startChildProcess(win: BrowserWindow) {
  centralEventbus.webContents = win.webContents;
  globalShortcut.register('CommandOrControl+Alt+num0', onScreenshot);
  globalShortcut.register('CommandOrControl+Alt+0', onScreenshot);
  remoteListener();
  onWindowOperator(win);
  win.webContents.on('new-window', async (event, url) => {
    event.preventDefault();
    await shell.openExternal(url);
  });
  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });
}
