import React from 'react';
import { CATEGORIES, LOCATIONS, JOB_TYPES, EXPERIENCE_LEVELS } from '../data/jobs';

export default function JobFilter({ filters, onChange, onClear, activeCount }) {

  const toggle = (key, value) => {
    const current = filters[key] || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    onChange({ ...filters, [key]: updated });
  };

  return (
    <aside className="filter-sidebar" aria-label="Job filters">

      {/* Header */}
      <div className="filter-header">
        <div className="filter-title">
          🔍 Filters
          {activeCount > 0 && (
            <span className="filter-badge">{activeCount}</span>
          )}
        </div>
        {activeCount > 0 && (
          <button className="filter-clear-btn" onClick={onClear} aria-label="Clear all filters">
            Clear all
          </button>
        )}
      </div>

      {/* Job Type */}
      <div className="filter-section">
        <div className="filter-section-title">Job Type</div>
        {JOB_TYPES.map(type => (
          <label key={type} className="filter-option" htmlFor={`type-${type}`}>
            <input
              type="checkbox"
              id={`type-${type}`}
              className="filter-checkbox"
              checked={(filters.types || []).includes(type)}
              onChange={() => toggle('types', type)}
            />
            <span className="filter-option-label">{type}</span>
          </label>
        ))}
      </div>

      {/* Department / Category */}
      <div className="filter-section">
        <div className="filter-section-title">Department</div>
        {CATEGORIES.map(cat => (
          <label key={cat.id} className="filter-option" htmlFor={`cat-${cat.id}`}>
            <input
              type="checkbox"
              id={`cat-${cat.id}`}
              className="filter-checkbox"
              checked={(filters.categories || []).includes(cat.id)}
              onChange={() => toggle('categories', cat.id)}
            />
            <span className="filter-option-label">{cat.icon} {cat.label}</span>
            <span className="filter-option-count">{cat.count}</span>
          </label>
        ))}
      </div>

      {/* Experience */}
      <div className="filter-section">
        <div className="filter-section-title">Experience</div>
        {EXPERIENCE_LEVELS.map(exp => (
          <label key={exp.id} className="filter-option" htmlFor={`exp-${exp.id}`}>
            <input
              type="checkbox"
              id={`exp-${exp.id}`}
              className="filter-checkbox"
              checked={(filters.experience || []).includes(exp.id)}
              onChange={() => toggle('experience', exp.id)}
            />
            <span className="filter-option-label">{exp.label}</span>
          </label>
        ))}
      </div>

      {/* Location */}
      <div className="filter-section">
        <div className="filter-section-title">Location</div>
        {LOCATIONS.map(loc => (
          <label key={loc} className="filter-option" htmlFor={`loc-${loc}`}>
            <input
              type="checkbox"
              id={`loc-${loc}`}
              className="filter-checkbox"
              checked={(filters.locations || []).includes(loc)}
              onChange={() => toggle('locations', loc)}
            />
            <span className="filter-option-label">{loc}</span>
          </label>
        ))}
      </div>

    </aside>
  );
}
