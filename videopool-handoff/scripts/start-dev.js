const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const root = process.cwd();
const electronBin = process.platform === 'win32'
  ? path.join(root, 'node_modules', '.bin', 'electron.cmd')
  : path.join(root, 'node_modules', '.bin', 'electron');

function getPort() {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

function waitForServer(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve();
    });
    req.on('error', () => setTimeout(() => waitForServer(url).then(resolve), 500));
  });
}

function run(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...options,
  });
  child.on('exit', (code) => {
    if (code !== 0) process.exit(code || 1);
  });
  return child;
}

(async () => {
  const port = await getPort();
  const viteUrl = `http://127.0.0.1:${port}/`;
  const vite = run(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['vite', '--host', '127.0.0.1', '--port', String(port)], {
    env: { ...process.env },
  });

  await waitForServer(viteUrl);

  const electron = run(electronBin, ['.'], {
    env: { ...process.env, VITE_DEV_SERVER_URL: viteUrl },
  });

  const shutdown = () => {
    vite.kill();
    electron.kill();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
})();
