const child_progress = require('child_process');

// development
Object.assign(process.env, {
  'BROWSER': 'none',
  'EXTEND_ESLINT': 'true',
  'PUBLIC_URL': '/',
  'PORT': '3333',
});

const progress = child_progress.exec('react-scripts start');
progress.stdout.pipe(process.stdout);
progress.stderr.pipe(process.stderr);
