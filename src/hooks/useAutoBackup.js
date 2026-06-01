import { useEffect, useRef, useState } from 'react';
import { createBackupSnapshot, readBackups, writeBackup } from '../utils/backupManager.js';
import { storageKeys } from '../utils/storageKeys.js';

const AUTO_BACKUP_DELAY = 1200;

export function useAutoBackup(data) {
  const [backups, setBackups] = useState(() => readBackups(storageKeys.backups));
  const lastPayloadRef = useRef('');

  function createBackup(reason = 'manual') {
    const snapshot = createBackupSnapshot(data, reason);
    setBackups(writeBackup(storageKeys.backups, snapshot));
    lastPayloadRef.current = JSON.stringify(data);
    return snapshot;
  }

  useEffect(() => {
    const payload = JSON.stringify(data);
    if (!payload || payload === lastPayloadRef.current) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      const snapshot = createBackupSnapshot(data, 'auto');
      setBackups(writeBackup(storageKeys.backups, snapshot));
      lastPayloadRef.current = payload;
    }, AUTO_BACKUP_DELAY);

    return () => window.clearTimeout(timer);
  }, [data]);

  return { backups, createBackup };
}
