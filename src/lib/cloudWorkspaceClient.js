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
    if (!response.ok) throw new Error(`cloud request failed (${response.status})`);
    return { data: await response.json(), error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const cloudWorkspace = {
  isConfigured: true,
  read: () => request(),
  write: (data) => request({ method: 'PUT', body: JSON.stringify({ data }) }),
};
