let unreadCount = 0;
const listeners = new Set<() => void>();

export function getUnreadCount(): number {
  return unreadCount;
}

export function setUnreadCount(next: number): void {
  const normalized = Number.isFinite(next) && next > 0 ? Math.floor(next) : 0;
  if (normalized === unreadCount) {
    return;
  }
  unreadCount = normalized;
  listeners.forEach(listener => listener());
}

export function subscribeUnreadCount(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
