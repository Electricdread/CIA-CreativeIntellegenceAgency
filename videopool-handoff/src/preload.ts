import { contextBridge, ipcRenderer } from 'electron';

const api = {
  startDownload: (url: string, options?: any) => ipcRenderer.invoke('download:start', url, options),
  cloneRepo: (repo: string, dest?: string) => ipcRenderer.invoke('repo:clone', repo, dest),
  openPath: (p: string) => ipcRenderer.invoke('open:path', p),
  listImages: (dir?: string) => ipcRenderer.invoke('images:list', dir),
  on: (channel: string, cb: (...args: any[]) => void) => {
    const valid = ['download:progress','download:finished','download:error'];
    if (valid.includes(channel)) ipcRenderer.on(channel, (_e, ...args) => cb(...args));
  }
};

contextBridge.exposeInMainWorld('api', api);

declare global {
  interface Window {
    api: {
      startDownload: (url: string, options?: any) => Promise<any>;
      cloneRepo: (repo: string, dest?: string) => Promise<any>;
      openPath?: (p: string) => Promise<any>;
      on: (channel: string, cb: (...args: any[]) => void) => void;
    }
  }
}