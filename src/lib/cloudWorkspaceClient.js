const workspaceEndpoint = 'https://yuli-sync-service.giving-comet-6875.chatgpt.site/api/workspace';

const request = async (options = {}) => {
  try {
    const response = await fetch(workspaceEndpoint, {
      cache: 'no-store',
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const error = new Error(`cloud request failed (${response.status})`);
      error.status = response.status;
      return { data, error };
    }
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const cloudWorkspace = {
  isConfigured: true,
  read: () => request(),
  write: (data, baseUpdatedAt = '') => request({ method: 'PUT', body: JSON.stringify({ data, base_updated_at: baseUpdatedAt || null }) }),
};
