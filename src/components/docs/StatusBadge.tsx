import React from 'react';
import { clsx } from 'clsx';

const STYLES: Record<string, string> = {
  queued: 'bg-gray-100 text-gray-700',
  running: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

const LABELS: Record<string, string> = {
  queued: 'Queued',
  running: 'Writing…',
  done: 'Ready',
  failed: 'Failed',
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', STYLES[status] || STYLES.queued)}>
    {LABELS[status] || status}
  </span>
);
