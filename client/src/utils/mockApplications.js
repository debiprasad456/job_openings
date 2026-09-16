// ── Mock Application Storage ──
// Stores applications in localStorage for development.
// Will be replaced by API calls when MongoDB Atlas is connected.

const APP_KEY = 'ds_applications';

export function getApplications() {
  try {
    return JSON.parse(localStorage.getItem(APP_KEY) || '[]');
  } catch {
    return [];
  }
}

export function getMyApplications(userId) {
  return getApplications().filter(a => a.userId === userId);
}

export function hasApplied(userId, jobId) {
  return getApplications().some(a => a.userId === userId && a.jobId === jobId);
}

export function submitApplication(data) {
  const apps = getApplications();

  // Prevent duplicate
  if (apps.some(a => a.userId === data.userId && a.jobId === data.jobId)) {
    throw new Error('You have already applied for this position.');
  }

  const application = {
    id: `app_${Date.now()}`,
    ...data,
    status: 'Applied',
    appliedAt: new Date().toISOString(),
  };

  localStorage.setItem(APP_KEY, JSON.stringify([...apps, application]));
  return application;
}

export function updateApplicationStatus(appId, status) {
  const apps = getApplications();
  const updated = apps.map(a => a.id === appId ? { ...a, status, updatedAt: new Date().toISOString() } : a);
  localStorage.setItem(APP_KEY, JSON.stringify(updated));
  return updated.find(a => a.id === appId);
}

// ── Admin-only helpers ──
export function getAllApplications() {
  return getApplications().sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
}

export function deleteApplication(appId) {
  const apps = getApplications().filter(a => a.id !== appId);
  localStorage.setItem(APP_KEY, JSON.stringify(apps));
}
