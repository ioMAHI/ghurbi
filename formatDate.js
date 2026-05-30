import { format } from 'date-fns';

export function formatTimestamp(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return format(d, 'dd/MM/yyyy, hh:mm a');
}

export function nowTimestamp() {
  return new Date().toISOString();
}