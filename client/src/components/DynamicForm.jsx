import React from 'react';

// ── DynamicForm renders per-role form fields from job.formSchema ──
// Each field: { fieldName, label, type, required, options? }

export default function DynamicForm({ schema, values, onChange, errors }) {
  const set = (fieldName, value) => {
    onChange({ ...values, [fieldName]: value });
  };

  if (!schema || schema.length === 0) {
    return (
      <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', fontStyle: 'italic' }}>
        No additional fields required for this role.
      </p>
    );
  }

  return (
    <div className="form-grid-2">
      {schema.map((field) => {
        const isFullWidth = field.type === 'textarea' || field.fieldName === 'coverNote' || field.fieldName === 'strategyCase' || field.fieldName === 'scmChallenge' || field.fieldName === 'salesAchievement' || field.fieldName === 'campaignExample' || field.fieldName === 'projectDescription';
        const hasError = errors?.[field.fieldName];

        return (
          <div
            key={field.fieldName}
            className={`form-group${isFullWidth ? ' form-grid-full' : ''}`}
          >
            <label
              className={`form-label${field.required ? ' required' : ''}`}
              htmlFor={`field-${field.fieldName}`}
            >
              {field.label}
            </label>

            {field.type === 'select' ? (
              <select
                id={`field-${field.fieldName}`}
                className="form-select"
                value={values[field.fieldName] || ''}
                onChange={e => set(field.fieldName, e.target.value)}
                aria-required={field.required}
                style={{ borderColor: hasError ? 'var(--color-error)' : '' }}
              >
                <option value="">— Select {field.label} —</option>
                {field.options?.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>

            ) : field.type === 'textarea' ? (
              <textarea
                id={`field-${field.fieldName}`}
                className="form-textarea"
                value={values[field.fieldName] || ''}
                onChange={e => set(field.fieldName, e.target.value)}
                placeholder={`Enter ${field.label.toLowerCase()}...`}
                aria-required={field.required}
                rows={4}
                style={{ borderColor: hasError ? 'var(--color-error)' : '' }}
              />

            ) : field.type === 'number' ? (
              <input
                id={`field-${field.fieldName}`}
                type="number"
                className="form-input"
                value={values[field.fieldName] || ''}
                onChange={e => set(field.fieldName, e.target.value)}
                placeholder={`Enter ${field.label.toLowerCase()}`}
                aria-required={field.required}
                min={0}
                style={{ borderColor: hasError ? 'var(--color-error)' : '' }}
              />

            ) : (
              <input
                id={`field-${field.fieldName}`}
                type={field.type === 'url' ? 'url' : 'text'}
                className="form-input"
                value={values[field.fieldName] || ''}
                onChange={e => set(field.fieldName, e.target.value)}
                placeholder={field.fieldName.toLowerCase().includes('linkedin') ? 'https://linkedin.com/in/yourname' : field.fieldName.toLowerCase().includes('url') || field.fieldName.toLowerCase().includes('portfolio') ? 'https://' : `Enter ${field.label.toLowerCase()}`}
                aria-required={field.required}
                style={{ borderColor: hasError ? 'var(--color-error)' : '' }}
              />
            )}

            {hasError && (
              <span className="form-error" role="alert">{hasError}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
