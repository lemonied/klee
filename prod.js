const packager = require('electron-packager');
const { resolve } = require('path');

const platform = (process.argv.find(v => v.indexOf('--') === 0) || '').replace(/^--/, '');

(async () => {
  const appPaths = await packager({
    platform,
    overwrite: true,
    icon: resolve(__dirname, './renderer/public/favicon.ico'),
    ignore: path => {
      return /^\/(renderer|src|\.idea|\.git)/.test(path);
    },
    name: 'Windy',
    dir: resolve(__dirname),
    win32metadata: {
      'requested-execution-level': 'requireAdministrator',
    },
  });
  console.log(`Electron app bundles created:\n${appPaths.join('\n')}`);
})();
