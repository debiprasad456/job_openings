import React, { useState } from 'react';
import '../styles/employer.css';

const EDUCATION_OPTIONS = [
  '10th Or Below 10th',
  '12th Pass',
  'Diploma',
  'ITI',
  'Graduate',
  'Post Graduate'
];

const ENGLISH_LEVELS = [
  'No English',
  'Basic English',
  'Good English'
];

const EXPERIENCE_OPTIONS = [
  { id: 'Any', label: 'Any' },
  { id: 'Experienced Only', label: 'Experienced Only' },
  { id: 'Fresher Only', label: 'Fresher Only' }
];

export default function EmployerJobPosting({ onJobCreated, onClose }) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Job details
    company: 'Diverse Solutions Pvt. Ltd.',
    companySize: '101-300',
    title: '',
    department: 'Sales & Marketing',
    category: 'Marketing',
    type: 'Full Time',
    isNightShift: false,
    workType: 'Work from office',
    location: 'Bhubaneswar, Odisha',
    salaryMin: '15000',
    salaryMax: '25000',
    salaryType: 'Monthly',

    // Step 2: Candidate requirements
    education: 'Graduate',
    englishLevel: 'Basic English',
    experience: 'Fresher Only',
    skills: 'Communication, Sales, MS Office',

    // Step 3: Interviewer info
    isWalkIn: true,
    interviewAddress: 'Ground floor, Plot, Palasuni, Rasulgarh, Bhubaneswar, Odisha 751025',
    walkinStartDate: new Date().toISOString().split('T')[0],
    walkinEndDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    walkinStartTime: '10:00 AM',
    walkinEndTime: '04:00 PM',
    interviewInstructions: 'Bring updated CV, Passport size photo, and ID proof.',
  });

  const updateForm = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleNext = () => {
    setErrorMsg('');
    if (step === 1) {
      if (!formData.title.trim()) {
        setErrorMsg('Please enter a Job Title / Designation.');
        return;
      }
      if (!formData.location) {
        setErrorMsg('Please select a Location.');
        return;
      }
    }
    setStep(prev => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setErrorMsg('');
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('ds_token');
      const formattedSalary = `₹${formData.salaryMin} - ₹${formData.salaryMax} / ${formData.salaryType.toLowerCase()}`;
      
      const payload = {
        title: formData.title,
        company: formData.company,
        companySize: formData.companySize,
        department: formData.department,
        category: formData.category,
        location: formData.location,
        type: formData.type,
        workType: formData.workType,
        isNightShift: formData.isNightShift,
        salary: formattedSalary,
        education: formData.education,
        englishLevel: formData.englishLevel,
        experience: formData.experience,
        tags: [formData.type, formData.category, formData.workType],
        shortDescription: `Hiring for ${formData.title} in ${formData.location}. ${formData.education} candidates preferred.`,
        description: `We are looking for an energetic ${formData.title} to join ${formData.company} in ${formData.location}. Requires ${formData.englishLevel} and ${formData.education} background.`,
        interviewDetails: formData.isWalkIn ? {
          isWalkIn: true,
          address: formData.interviewAddress,
          startDate: formData.walkinStartDate,
          endDate: formData.walkinEndDate,
          timings: `${formData.walkinStartTime} - ${formData.walkinEndTime}`,
          instructions: formData.interviewInstructions
        } : null,
      };

      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to publish job.');
      }

      setSuccessMsg('🎉 Job Opening Published Successfully!');
      setTimeout(() => {
        onJobCreated?.(data.job);
        onClose?.();
      }, 1500);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="employer-posting-container">
      
      {/* ── Stepper Header ── */}
      <div className="employer-stepper">
        <div className={`step-item ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
          <div className="step-circle">{step > 1 ? '✓' : '1'}</div>
          <span className="step-label">Job details</span>
        </div>
        <div className="step-line" />
        <div className={`step-item ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
          <div className="step-circle">{step > 2 ? '✓' : '2'}</div>
          <span className="step-label">Candidate requirements</span>
        </div>
        <div className="step-line" />
        <div className={`step-item ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
          <div className="step-circle">{step > 3 ? '✓' : '3'}</div>
          <span className="step-label">Interviewer info</span>
        </div>
        <div className="step-line" />
        <div className={`step-item ${step >= 4 ? 'active' : ''}`}>
          <div className="step-circle">4</div>
          <span className="step-label">Job preview</span>
        </div>
      </div>

      {errorMsg && <div className="employer-alert error">{errorMsg}</div>}
      {successMsg && <div className="employer-alert success">{successMsg}</div>}

      {/* ── Step 1: Job Details ── */}
      {step === 1 && (
        <div className="employer-step-card animate-fade-in">
          <h2 className="step-title">Post a new job</h2>
          <p className="step-subtitle">We use this information to find the best candidates for the job.</p>

          <div className="form-group">
            <label className="form-label">Company you're hiring for *</label>
            <input
              type="text"
              className="form-input"
              value={formData.company}
              onChange={e => updateForm('company', e.target.value)}
              placeholder="e.g. Swiggy, Diverse Solutions"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Job title / Designation *</label>
            <input
              type="text"
              className="form-input"
              value={formData.title}
              onChange={e => updateForm('title', e.target.value)}
              placeholder="e.g. Marketing Executive, Accountant"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Department / Category *</label>
            <select
              className="form-select"
              value={formData.category}
              onChange={e => updateForm('category', e.target.value)}
            >
              <option value="Finance">Finance & Accounts</option>
              <option value="Marketing">Sales & Marketing</option>
              <option value="HR">Human Resources</option>
              <option value="Operations">Operations & SCM</option>
              <option value="Strategy">Strategy & Consulting</option>
              <option value="Analytics">Business Analytics</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Type of Job *</label>
            <div className="chip-selector">
              {['Full Time', 'Part Time', 'Both'].map(t => (
                <button
                  key={t}
                  type="button"
                  className={`chip-btn ${formData.type === t ? 'selected' : ''}`}
                  onClick={() => updateForm('type', t)}
                >
                  {t}
                </button>
              ))}
            </div>
            <label className="checkbox-label" style={{ marginTop: '8px' }}>
              <input
                type="checkbox"
                checked={formData.isNightShift}
                onChange={e => updateForm('isNightShift', e.target.checked)}
              />
              This is a night shift job
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">Work Location *</label>
            <select
              className="form-select"
              value={formData.location}
              onChange={e => updateForm('location', e.target.value)}
            >
              <option value="Bhubaneswar, Odisha">Bhubaneswar, Odisha</option>
              <option value="Mumbai, Maharashtra">Mumbai, Maharashtra</option>
              <option value="Delhi NCR">Delhi NCR</option>
              <option value="Bengaluru, Karnataka">Bengaluru, Karnataka</option>
              <option value="Pune, Maharashtra">Pune, Maharashtra</option>
              <option value="Hyderabad, Telangana">Hyderabad, Telangana</option>
              <option value="Chennai, Tamil Nadu">Chennai, Tamil Nadu</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Monthly Salary Range (₹) *</label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Min Salary (e.g. 15000)"
                value={formData.salaryMin}
                onChange={e => updateForm('salaryMin', e.target.value)}
              />
              <span>to</span>
              <input
                type="text"
                className="form-input"
                placeholder="Max Salary (e.g. 25000)"
                value={formData.salaryMax}
                onChange={e => updateForm('salaryMax', e.target.value)}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-primary btn-lg" onClick={handleNext}>
              Next: Candidate Requirements →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Candidate Requirements ── */}
      {step === 2 && (
        <div className="employer-step-card animate-fade-in">
          <h2 className="step-title">Basic Requirements</h2>
          <p className="step-subtitle">Specify candidate qualification criteria to attract the right applicants.</p>

          <div className="form-group">
            <label className="form-label">Minimum Education *</label>
            <div className="chip-selector">
              {EDUCATION_OPTIONS.map(edu => (
                <button
                  key={edu}
                  type="button"
                  className={`chip-btn ${formData.education === edu ? 'selected' : ''}`}
                  onClick={() => updateForm('education', edu)}
                >
                  {edu}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">English level required *</label>
            <div className="chip-selector">
              {ENGLISH_LEVELS.map(eng => (
                <button
                  key={eng}
                  type="button"
                  className={`chip-btn ${formData.englishLevel === eng ? 'selected' : ''}`}
                  onClick={() => updateForm('englishLevel', eng)}
                >
                  {eng}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Total experience required *</label>
            <div className="chip-selector">
              {EXPERIENCE_OPTIONS.map(exp => (
                <button
                  key={exp.id}
                  type="button"
                  className={`chip-btn ${formData.experience === exp.id ? 'selected' : ''}`}
                  onClick={() => updateForm('experience', exp.id)}
                >
                  {exp.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Key Skills & Tags</label>
            <input
              type="text"
              className="form-input"
              value={formData.skills}
              onChange={e => updateForm('skills', e.target.value)}
              placeholder="e.g. Sales, MS Excel, Negotiation"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={handleBack}>
              ← Back
            </button>
            <button type="button" className="btn btn-primary btn-lg" onClick={handleNext}>
              Next: Interview Details →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Interviewer & Walk-in Info ── */}
      {step === 3 && (
        <div className="employer-step-card animate-fade-in">
          <h2 className="step-title">Interview method and address</h2>
          <p className="step-subtitle">Let candidates know how and where the interview will be conducted.</p>

          <div className="form-group">
            <label className="form-label">Is this a walk-in interview? *</label>
            <div style={{ display: 'flex', gap: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="walkin"
                  checked={formData.isWalkIn === true}
                  onChange={() => updateForm('isWalkIn', true)}
                />
                Yes (Walk-in)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="walkin"
                  checked={formData.isWalkIn === false}
                  onChange={() => updateForm('isWalkIn', false)}
                />
                No (Online / Scheduled call)
              </label>
            </div>
          </div>

          {formData.isWalkIn && (
            <>
              <div className="form-group">
                <label className="form-label">Walk-in Interview Address *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.interviewAddress}
                  onChange={e => updateForm('interviewAddress', e.target.value)}
                  placeholder="Full office address"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Walk-in Dates *</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.walkinStartDate}
                    onChange={e => updateForm('walkinStartDate', e.target.value)}
                  />
                  <input
                    type="date"
                    className="form-input"
                    value={formData.walkinEndDate}
                    onChange={e => updateForm('walkinEndDate', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Walk-in Timings *</label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.walkinStartTime}
                    onChange={e => updateForm('walkinStartTime', e.target.value)}
                    placeholder="10:00 AM"
                  />
                  <span>-</span>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.walkinEndTime}
                    onChange={e => updateForm('walkinEndTime', e.target.value)}
                    placeholder="04:00 PM"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Other Instructions</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  value={formData.interviewInstructions}
                  onChange={e => updateForm('interviewInstructions', e.target.value)}
                  placeholder="e.g. Bring updated CV, ID proof"
                />
              </div>
            </>
          )}

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={handleBack}>
              ← Back
            </button>
            <button type="button" className="btn btn-primary btn-lg" onClick={handleNext}>
              Preview Job Posting →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Job Preview & Publishing ── */}
      {step === 4 && (
        <div className="employer-step-card animate-fade-in">
          <h2 className="step-title">Job Preview & Confirmation</h2>
          <p className="step-subtitle">Review your job listing details before publishing to candidates.</p>

          <div className="preview-card">
            <div className="preview-header">
              <h3>{formData.title || 'Untitled Job'}</h3>
              <span className="preview-badge">{formData.type}</span>
            </div>

            <div className="preview-grid">
              <div><strong>Company:</strong> {formData.company}</div>
              <div><strong>Category:</strong> {formData.category}</div>
              <div><strong>Location:</strong> {formData.location}</div>
              <div><strong>Salary:</strong> ₹{formData.salaryMin} - ₹{formData.salaryMax} / {formData.salaryType}</div>
              <div><strong>Shift:</strong> {formData.isNightShift ? 'Night Shift' : 'Day Shift'}</div>
              <div><strong>Education:</strong> {formData.education}</div>
              <div><strong>English:</strong> {formData.englishLevel}</div>
              <div><strong>Experience:</strong> {formData.experience}</div>
            </div>

            {formData.isWalkIn && (
              <div className="preview-walkin-box">
                <h4>🚶‍♂️ Walk-In Interview Details</h4>
                <p><strong>Address:</strong> {formData.interviewAddress}</p>
                <p><strong>Timings:</strong> {formData.walkinStartTime} - {formData.walkinEndTime}</p>
                <p><strong>Notes:</strong> {formData.interviewInstructions}</p>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={handleBack} disabled={isSubmitting}>
              ← Back to Edit
            </button>
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Publishing Job...' : '🚀 Publish Job Opening'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
