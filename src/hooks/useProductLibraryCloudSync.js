import { useWorkspaceCloudSync } from './useWorkspaceCloudSync.js';

export function useProductLibraryCloudSync(localData, setLocalData) {
  return useWorkspaceCloudSync('productLibrary', localData, setLocalData);
}