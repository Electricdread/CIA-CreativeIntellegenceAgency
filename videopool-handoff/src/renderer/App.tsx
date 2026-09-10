import React, { useState, useEffect } from 'react';
import EditVideoTab from './EditVideoTab';

const api = window.api;

function isValidUrl(value: string) {
  try {
    const parsed = new URL(value);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export default function App() {
  const [url, setUrl] = useState('https://www.youtube.com/watch?v=kwG8qna3WU0');
  const [collections, setCollections] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('vp:collections') || '[]'); } catch { return []; }
  });
  const [status, setStatus] = useState('Ready to download');
  const [tab, setTab] = useState<'download'|'collections'|'edit'>('download');

  useEffect(() => {
    if (api?.on) {
      api.on('download:progress', (p: any) => {
        if (p?.type === 'starting') setStatus(`Starting download for ${p.url}`);
        else if (p?.type === 'output') setStatus(p.text.trim() || 'Downloading...');
        else if (p?.type === 'complete') setStatus(`Completed: ${p.files.join(', ')}`);
        else if (p?.type === 'failed') setStatus(`Failed with code ${p.code}`);
        else setStatus(JSON.stringify(p));
      });
    }
  }, []);

  const start = async () => {
    const trimmed = url.trim();
    if (!isValidUrl(trimmed)) {
      setStatus('Please enter a valid http(s) URL.');
      return;
    }

    setStatus('Starting download...');
    try {
      if (!api?.startDownload) {
        throw new Error('Preload API unavailable');
      }
      const res = await api.startDownload(trimmed, { outDir: null });
      setStatus(`Downloaded: ${res.files.length ? res.files.join(', ') : 'check output folder'}`);
    } catch (e: any) {
      setStatus('error: ' + (e.message || e));
    }
  };

  const openDownloads = async () => {
    if (api?.openPath) {
      await api.openPath('C:/Users/DSX36/VideoPool');
      setStatus('Opened downloads folder.');
    } else {
      setStatus('Open-folder support is unavailable in this build.');
    }
  };

  const addCollection = () => {
    const name = prompt('Collection name');
    if (!name) return;
    const next = [...collections, name];
    setCollections(next);
    localStorage.setItem('vp:collections', JSON.stringify(next));
  };

  return (
    <div style={{ padding: 24, fontFamily: 'Segoe UI, Roboto, sans-serif' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 style={{ margin: 0 }}>VideoPool</h1>
        <nav style={{ marginLeft: 24 }}>
          <button onClick={() => setTab('download')} disabled={tab==='download'}>Download</button>
          <button onClick={() => setTab('collections')} disabled={tab==='collections'}>Collections</button>
          <button onClick={() => setTab('edit')} disabled={tab==='edit'}>Edit Video</button>
        </nav>
      </header>

      {tab === 'download' && (
        <section style={{ marginTop: 12 }}>
          <div>
            <input style={{ width: 600 }} value={url} onChange={e => setUrl(e.target.value)} placeholder="Paste YouTube or media URL" />
            <button onClick={start}>Download</button>
            <button onClick={openDownloads} style={{ marginLeft: 8 }}>Open Folder</button>
          </div>
          <div style={{ marginTop: 12 }}>
            <strong>Status:</strong> {status}
          </div>
        </section>
      )}

      {tab === 'collections' && (
        <section style={{ marginTop: 12 }}>
          <h3>Collections</h3>
          <button onClick={addCollection}>+ New Collection</button>
          <ul>
            {collections.map(c => <li key={c}>{c}</li>)}
          </ul>
        </section>
      )}

      {tab === 'edit' && (
        <section style={{ marginTop: 12 }}>
          <EditVideoTab />
        </section>
      )}

    </div>
  );
}