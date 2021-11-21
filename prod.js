const packager = require('electron-packager');
const { resolve } = require('path');

(async () => {
  const appPaths = await packager({
    platform: 'win32',
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
