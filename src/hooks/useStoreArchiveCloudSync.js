import { useWorkspaceCloudSync } from './useWorkspaceCloudSync.js';

export function useStoreArchiveCloudSync(localData, setLocalData) {
  return useWorkspaceCloudSync('storeProductArchive', localData, setLocalData);
}