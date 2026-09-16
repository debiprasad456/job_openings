import React from 'react';

const STATUS_CONFIG = {
  'Applied':      { label: 'Applied',      icon: '📨' },
  'Under Review': { label: 'Under Review', icon: '🔍' },
  'Shortlisted':  { label: 'Shortlisted',  icon: '⭐' },
  'Rejected':     { label: 'Rejected',     icon: '❌' },
  'Selected':     { label: 'Selected',     icon: '🎉' },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, icon: '📋' };
  // CSS class uses status with spaces replaced to avoid issues
  const cls = status?.replace(/\s+/g, '-') || 'Applied';

  return (
    <span className={`status-badge ${cls}`} aria-label={`Application status: ${config.label}`}>
      {config.icon} {config.label}
    </span>
  );
}
