import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ── Relative time helper ──
function timeAgo(dateStr) {
  const posted = new Date(dateStr);
  const now = new Date();
  const days = Math.floor((now - posted) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`;
  return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''} ago`;
}

// ── Type badge color mapping ──
const TYPE_BADGE = {
  'Full Time':   'badge-navy',
  'Part Time':   'badge-yellow',
  'Remote':      'badge-green',
  'Internship':  'badge-orange',
};

export default function JobCard({ job }) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.stopPropagation();
    setSaved(prev => !prev);
  };

  return (
    <article className="job-card animate-fade-in-up" aria-label={`Job: ${job.title}`}>

      {/* Header */}
      <div className="job-card-header">
        <img
          src="/assets/logo.png"
          alt="Diverse Solutions"
          className="job-card-logo"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <div className="job-card-title-wrap">
          <h2 className="job-card-title">{job.title}</h2>
          <div className="job-card-company">Diverse Solutions Pvt. Ltd.</div>
        </div>
        <button
          className={`job-card-save${saved ? ' saved' : ''}`}
          onClick={handleSave}
          aria-label={saved ? 'Remove from saved' : 'Save job'}
          title={saved ? 'Saved' : 'Save'}
        >
          {saved ? '🔖' : '🔖'}
          <span style={{ fontSize: '10px', display: 'block', color: saved ? 'var(--color-primary)' : 'var(--color-text-disabled)' }}>
            {saved ? 'Saved' : 'Save'}
          </span>
        </button>
      </div>

      {/* Meta Row */}
      <div className="job-card-meta">
        <div className="meta-item">
          <span className="meta-icon">📍</span>
          <span>{job.location}</span>
        </div>
        <div className="meta-item">
          <span className="meta-icon">💼</span>
          <span>{job.experience}</span>
        </div>
        <div className="meta-item">
          <span className="meta-icon">💰</span>
          <span>{job.salary}</span>
        </div>
        <div className="meta-item">
          <span className="meta-icon">🏢</span>
          <span>{job.department}</span>
        </div>
      </div>

      {/* Tags */}
      <div className="job-card-tags">
        <span className={`badge ${TYPE_BADGE[job.type] || 'badge-gray'}`}>{job.type}</span>
        {job.tags.slice(0, 3).map(tag => (
          <span key={tag} className="badge badge-gray">{tag}</span>
        ))}
      </div>

      {/* Short Description */}
      <p className="job-card-desc">{job.shortDescription}</p>

      {/* Footer */}
      <div className="job-card-footer">
        <div className="job-card-posted">
          🕐 Posted {timeAgo(job.postedDate)}
        </div>
        <div className="job-card-actions">
          {user ? (
            <Link
              to={`/apply/${job.id}`}
              className="btn btn-primary btn-sm"
              id={`apply-btn-${job.id}`}
              aria-label={`Apply for ${job.title}`}
            >
              Apply Now →
            </Link>
          ) : (
            <Link
              to="/login"
              state={{ from: `/apply/${job.id}` }}
              className="btn btn-primary btn-sm"
              id={`login-apply-btn-${job.id}`}
              aria-label={`Login to apply for ${job.title}`}
            >
              Apply Now →
            </Link>
          )}
          <Link
            to={`/apply/${job.id}`}
            className="btn btn-outline btn-sm"
            id={`details-btn-${job.id}`}
            aria-label={`View details for ${job.title}`}
          >
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}
