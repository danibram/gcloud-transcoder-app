const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const command = process.argv[2];

if (!command) {
  console.error('Usage: node src-tauri/scripts/run-ui-command.cjs <npm-script>');
  process.exit(1);
}

if (!/^[A-Za-z0-9:_-]+$/.test(command)) {
  console.error(`Invalid npm script name: ${command}`);
  process.exit(1);
}

const candidates = [
  path.resolve(process.cwd(), 'ui'),
  path.resolve(process.cwd(), '../ui'),
  path.resolve(__dirname, '../../ui'),
  path.resolve(__dirname, '../ui'),
];

const uiDir = candidates.find((dir) => fs.existsSync(path.join(dir, 'package.json')));

if (!uiDir) {
  console.error('Could not locate the ui package directory.');
  process.exit(1);
}

const result = spawnSync('npm', ['run', command], {
  cwd: uiDir,
  shell: process.platform === 'win32',
  stdio: 'inherit',
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
