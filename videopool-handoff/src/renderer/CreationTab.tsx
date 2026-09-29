import React, { useEffect, useState } from 'react';

export default function CreationTab() {
  const [images, setImages] = useState<string[]>([]);
  const [status, setStatus] = useState('idle');
  const [folder, setFolder] = useState('creations');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setStatus('loading');
    try {
      const res = await (window as any).api.listImages(folder);
      setImages(res || []);
      setStatus('loaded');
    } catch (e: any) {
      setStatus('error');
    }
  };

  const openImage = (p: string) => {
    (window as any).api.openPath(p);
  };

  return (
    <div style={{ padding: 12 }}>
      <h2>Creation</h2>
      <div style={{ marginBottom: 8 }}>
        <label>Images folder (relative to app cwd or absolute):</label>
        <input style={{ marginLeft: 8, width: 420 }} value={folder} onChange={e => setFolder(e.target.value)} />
        <button onClick={load} style={{ marginLeft: 8 }}>Refresh</button>
      </div>
      <div>
        <strong>Status:</strong> {status}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, 160px)', gap: 12, marginTop: 12 }}>
        {images.map(img => (
          <div key={img} style={{ cursor: 'pointer' }} onClick={() => openImage(img)}>
            <img src={`file:///${img.replace(/\\/g, '/').replace(/ /g, '%20')}`} alt="thumb" style={{ width: 160, height: 90, objectFit: 'cover', borderRadius: 6 }} />
            <div style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: 160 }}>{img.split(/[\\/]/).slice(-1)[0]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}