// ── Mock Auth Utilities ──
// Provides client-side auth for development.
// When MongoDB Atlas is connected in Phase 3 API setup, these will be
// replaced by fetch('/api/auth/login') and fetch('/api/auth/register').

const USERS_KEY = 'ds_users_db';

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Simple base64 "JWT-like" token for dev purposes
function makeToken(user) {
  const payload = { id: user.id, email: user.email, role: user.role, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 };
  return btoa(JSON.stringify(payload));
}

export function mockRegister({ name, email, phone, password }) {
  const users = getUsers();
  const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (exists) throw new Error('An account with this email already exists.');

  const user = {
    id: `user_${Date.now()}`,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone: phone.trim(),
    passwordHash: btoa(password), // NOT real hashing — dev only
    role: 'candidate',
    createdAt: new Date().toISOString(),
  };

  saveUsers([...users, user]);

  const { passwordHash, ...safeUser } = user;
  const token = makeToken(safeUser);
  return { user: safeUser, token };
}

export function mockLogin({ email, password }) {
  // ── Built-in admin account (dev only) ──
  if (
    email.toLowerCase().trim() === 'admin@diversesolutions.com' &&
    password === 'Admin@1234'
  ) {
    const adminUser = { id: 'admin_001', name: 'Admin User', email: 'admin@diversesolutions.com', phone: '9000000000', role: 'admin' };
    const token = makeToken(adminUser);
    return { user: adminUser, token };
  }

  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());

  if (!user) throw new Error('No account found with this email.');
  if (atob(user.passwordHash) !== password) throw new Error('Incorrect password. Please try again.');

  const { passwordHash, ...safeUser } = user;
  const token = makeToken(safeUser);
  return { user: safeUser, token };
}
