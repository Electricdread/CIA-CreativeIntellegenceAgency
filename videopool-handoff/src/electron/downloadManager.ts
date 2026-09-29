import { spawn } from 'child_process';
import * as path from 'path';
import { app } from 'electron';
import * as fs from 'fs';

export async function startDownload(url: string, options: any = {}, onProgress?: (payload: any) => void) {
  // Resolve bundled yt-dlp location: resources/yt-dlp.exe for Windows builds
  const exeName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
  // Look in app resources or repository resources for dev
  const candidatePaths = [
    path.join(process.resourcesPath || '', exeName),
    path.join(__dirname, '..', '..', 'resources', exeName),
    path.join(process.cwd(), exeName)
  ];
  const exe = candidatePaths.find(p => fs.existsSync(p));
  if (!exe) {
    throw new Error('yt-dlp executable not found. Place yt-dlp.exe in the app resources or repo root.');
  }

  const outDir = options.outDir || (path.join(app.getPath('home'), 'VideoPool'));
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const ytdlpArgs = [
    url,
    '--no-playlist',
    '-o', path.join(outDir, '%(title)s [%(id)s].%(ext)s')
  ];

  if (onProgress) onProgress({ type: 'starting', url, outDir });

  const proc = spawn(exe, ytdlpArgs, { windowsHide: true });

  return new Promise((resolve, reject) => {
    let output = '';
    proc.stdout.on('data', data => {
      const text = data.toString();
      output += text;
      if (onProgress) onProgress({ type: 'output', text });
    });
    proc.stderr.on('data', data => {
      const text = data.toString();
      output += text;
      if (onProgress) onProgress({ type: 'error', text });
    });
    proc.on('close', code => {
      if (code === 0) {
        const files = fs.readdirSync(outDir).filter(f => f.includes(url.split('v=')[1] || ''));
        if (onProgress) onProgress({ type: 'complete', outDir, files, output });
        resolve({ outDir, files, output });
      } else {
        if (onProgress) onProgress({ type: 'failed', code, output });
        reject(new Error('yt-dlp exited with code ' + code));
      }
    });
  });
}
