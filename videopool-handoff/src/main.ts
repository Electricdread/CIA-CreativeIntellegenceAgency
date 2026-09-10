import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'path';
import { startDownload } from './electron/downloadManager';
import { spawn } from 'child_process';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) win.loadURL(devUrl);
  else win.loadFile(path.join(__dirname, '../public/index.html'));
  mainWindow = win;
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('download:start', async (_evt, url: string, options: any) => {
  return startDownload(url, options, (payload) => {
    mainWindow?.webContents.send('download:progress', payload);
  });
});

ipcMain.handle('repo:clone', async (_evt, repo: string, dest?: string) => {
  // repo: 'owner/name' and dest: relative path under app cwd
  const cwd = process.cwd();
  const target = dest ? path.isAbsolute(dest) ? dest : path.join(cwd, dest) : path.join(cwd, 'third_party', repo.split('/')[1]);
  if (!fs.existsSync(path.dirname(target))) fs.mkdirSync(path.dirname(target), { recursive: true });

  return new Promise((resolve, reject) => {
    const args = ['repo', 'clone', repo, target];
    const proc = spawn('gh', args, { cwd, windowsHide: true });
    let out = '';
    let err = '';
    proc.stdout.on('data', d => out += d.toString());
    proc.stderr.on('data', d => err += d.toString());
    proc.on('close', code => {
      if (code === 0) resolve({ ok: true, path: target, out });
      else reject(new Error('gh clone failed: ' + err));
    });
  });
});

ipcMain.handle('open:path', async (_evt, p: string) => {
  const cwd = process.cwd();
  const target = path.isAbsolute(p) ? p : path.join(cwd, p);
  if (fs.existsSync(target)) {
    await shell.openPath(target);
    return { ok: true, path: target };
  }
  return { ok: false, error: 'Path not found', path: target };
});

ipcMain.handle('images:list', async (_evt, dir?: string) => {
  const cwd = process.cwd();
  const target = dir ? (path.isAbsolute(dir) ? dir : path.join(cwd, dir)) : path.join(cwd, 'creations');
  if (!fs.existsSync(target)) return [];
  const exts = ['.jpg','.jpeg','.png','.webp','.gif','.bmp','.tiff'];
  const out: string[] = [];
  const walk = (p: string) => {
    const entries = fs.readdirSync(p, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(p, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.isFile() && exts.includes(path.extname(e.name).toLowerCase())) out.push(full);
    }
  };
  try { walk(target); } catch (e) { return [] }
  // sort newest first
  return out.sort((a,b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
});