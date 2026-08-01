/**
 * Format bytes to human readable size
 * @param {number} bytes
 * @param {number} decimals
 */
export const formatBytes = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

/**
 * Format a date to relative time (e.g. "2 hours ago")
 * @param {Date|string} date
 */
export const timeAgo = (date) => {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
};

/**
 * Format expiry date
 */
export const formatExpiry = (date) => {
  if (!date) return 'No expiry';
  const d = new Date(date);
  const now = new Date();
  if (d < now) return 'Expired';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get file extension
 */
export const getExtension = (filename) => {
  return filename?.split('.').pop()?.toLowerCase() || '';
};

/**
 * Get file icon color class by mime type
 */
export const getFileColor = (mimeType) => {
  if (!mimeType) return 'text-surface-400';
  if (mimeType.startsWith('image/')) return 'text-primary-400';
  if (mimeType.startsWith('video/')) return 'text-secondary-400';
  if (mimeType.startsWith('audio/')) return 'text-success-500';
  if (mimeType === 'application/pdf') return 'text-danger-500';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return 'text-warning-500';
  return 'text-surface-400';
};

/**
 * Generate a random color for avatar
 */
export const stringToColor = (str = '') => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    'bg-primary-500', 'bg-secondary-500', 'bg-success-500',
    'bg-warning-500', 'bg-danger-500',
  ];
  return colors[Math.abs(hash) % colors.length];
};
