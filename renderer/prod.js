const child_progress = require('child_process');

// production
Object.assign(process.env, {
  'EXTEND_ESLINT': true,
  'PUBLIC_URL': '/',
  'GENERATE_SOURCEMAP': false,
  'BUILD_PATH': '../dist/view',
});

const progress = child_progress.exec('react-scripts build');
progress.stdout.pipe(process.stdout);
progress.stderr.pipe(process.stderr);
