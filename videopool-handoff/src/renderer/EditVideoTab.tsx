import React, { useState } from 'react';

export default function EditVideoTab() {
  const [status, setStatus] = useState<string | null>(null);
  const [repoPath, setRepoPath] = useState('third_party/RobustVideoMatting');

  const cloneRepo = async () => {
    setStatus('cloning...');
    try {
      const res = await (window as any).api.cloneRepo('PeterL1n/RobustVideoMatting', repoPath);
      setStatus('Cloned: ' + JSON.stringify(res));
    } catch (e: any) {
      setStatus('Error: ' + (e.message || e));
    }
  };

  const openFolder = () => {
    (window as any).api.openPath && (window as any).api.openPath(repoPath);
  };

  return (
    <div style={{ padding: 12 }}>
      <h2>Edit Video</h2>
      <p>This tab prepares the external RobustVideoMatting tool for local editing/AI processing.</p>
      <div style={{ marginBottom: 8 }}>
        <label>Destination path:</label>
        <input style={{ width: 420, marginLeft: 8 }} value={repoPath} onChange={e => setRepoPath(e.target.value)} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={cloneRepo}>Clone RobustVideoMatting</button>
        <button onClick={openFolder}>Open Folder</button>
      </div>
      <div style={{ marginTop: 12 }}>
        <strong>Status:</strong> {status}
      </div>
      <div style={{ marginTop: 18 }}>
        <p>Notes: After cloning, follow the repo README to install dependencies and models. The app will later integrate model-run hooks.</p>
      </div>
    </div>
  );
}