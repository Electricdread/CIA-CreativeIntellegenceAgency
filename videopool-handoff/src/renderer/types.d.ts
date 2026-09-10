export {};

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