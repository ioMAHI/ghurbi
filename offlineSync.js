const OUTBOX_KEY = 'tour_app_outbox';

export function getOutbox() {
  const raw = localStorage.getItem(OUTBOX_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function pushToOutbox(item) {
  const outbox = getOutbox();
  outbox.push({ ...item, _offlineId: Date.now() + '_' + Math.random().toString(36).slice(2, 8) });
  localStorage.setItem(OUTBOX_KEY, JSON.stringify(outbox));
}

export function removeFromOutbox(offlineId) {
  const outbox = getOutbox().filter(i => i._offlineId !== offlineId);
  localStorage.setItem(OUTBOX_KEY, JSON.stringify(outbox));
}

export function isOnline() {
  return window.navigator.onLine;
}