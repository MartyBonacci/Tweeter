/**
 * Formats a Date object as a relative time string or absolute date.
 *
 * @param date - The date to format
 * @returns Human-readable relative time or formatted date string
 *
 * @example
 * formatRelativeTime(new Date()) // "just now"
 * formatRelativeTime(new Date(Date.now() - 30 * 60000)) // "30m ago"
 * formatRelativeTime(new Date(Date.now() - 5 * 3600000)) // "5h ago"
 * formatRelativeTime(new Date(Date.now() - 3 * 86400000)) // "3d ago"
 * formatRelativeTime(new Date('2025-01-15')) // "Jan 15, 2025"
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  // Format as "Jan 15, 2025"
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
