const thumbnailCache = new Map();

async function cloudThumbnail(dataUrl) {
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) return dataUrl;
  if (!thumbnailCache.has(dataUrl)) {
    thumbnailCache.set(dataUrl, (async () => {
      try {
        const image = await createImageBitmap(await (await fetch(dataUrl)).blob());
        const scale = Math.min(1, 200 / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        image.close();
        const thumbnail = canvas.toDataURL('image/webp', 0.62);
        return thumbnail.length < dataUrl.length ? thumbnail : dataUrl;
      } catch {
        return dataUrl;
      }
    })());
  }
  return thumbnailCache.get(dataUrl);
}

// Keep the local full-size image when the cloud only contains its exact thumbnail.
export async function retainLocalOriginalImages(cloudWorkspace, localWorkspace) {
  const result = { ...cloudWorkspace };
  for (const [key, records] of Object.entries(cloudWorkspace || {})) {
    if (!Array.isArray(records) || !Array.isArray(localWorkspace?.[key])) continue;
    const localById = new Map(localWorkspace[key].map((record) => [record?.id, record]));
    result[key] = await Promise.all(records.map(async (record) => {
      const local = localById.get(record?.id);
      if (!local?.imageDataUrl || !record?.imageDataUrl) return record;
      const matchingThumbnail = await cloudThumbnail(local.imageDataUrl);
      return record.imageDataUrl === matchingThumbnail
        ? { ...record, imageDataUrl: local.imageDataUrl }
        : record;
    }));
  }
  return result;
}

export async function prepareWorkspaceForCloud(workspace) {
  async function prepare(value) {
    if (Array.isArray(value)) return Promise.all(value.map(prepare));
    if (!value || typeof value !== 'object') return value;
    const entries = await Promise.all(Object.entries(value).map(async ([key, item]) => [
      key,
      key === 'imageDataUrl' ? await cloudThumbnail(item) : await prepare(item),
    ]));
    return Object.fromEntries(entries);
  }
  return prepare(workspace);
}
