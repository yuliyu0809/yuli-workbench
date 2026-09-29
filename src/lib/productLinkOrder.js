export function creationTimeForLink(editing, now) {
  return editing ? editing.createdAt || editing.updatedAt || '' : now;
}

export function sortProductLinksNewestFirst(links) {
  return [...links].sort((left, right) => {
    const leftTime = Date.parse(left.createdAt || left.updatedAt || '') || 0;
    const rightTime = Date.parse(right.createdAt || right.updatedAt || '') || 0;
    return rightTime - leftTime;
  });
}
