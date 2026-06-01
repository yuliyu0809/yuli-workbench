const MAX_BACKUPS = 10;

export function createBackupSnapshot(data, reason = 'auto') {
  return {
    id: `backup-${Date.now()}`,
    reason,
    createdAt: new Date().toLocaleString('zh-CN'),
    version: '1.2',
    data,
  };
}

export function readBackups(key) {
  try {
    return JSON.parse(window.localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

export function writeBackup(key, snapshot) {
  const backups = readBackups(key);
  const nextBackups = [snapshot, ...backups].slice(0, MAX_BACKUPS);
  window.localStorage.setItem(key, JSON.stringify(nextBackups));
  return nextBackups;
}

export function downloadBackup(snapshot) {
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `yuli-workbench-backup-${snapshot.id}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
