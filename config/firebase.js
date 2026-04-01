// config/firebase.js — Firebase Admin SDK initializer
const admin = require('firebase-admin');

// Use mock credentials for development
if (!admin.apps.length) {
  try {
    // Skip Firebase initialization entirely for development
    console.log('Skipping Firebase initialization - using mock mode');
  } catch (error) {
    console.warn('Firebase initialization failed, using mock mode:', error.message);
  }
}

// Mock database and auth for development
const mockDb = {
  collection: (name) => ({
    doc: (id) => ({
      get: () => Promise.resolve({ exists: true, data: () => ({}) }),
      set: () => Promise.resolve(),
      update: () => Promise.resolve(),
      delete: () => Promise.resolve()
    }),
    add: () => Promise.resolve({ id: 'mock-doc-id' }),
    get: () => Promise.resolve({ docs: [] }),
    where: () => ({ get: () => Promise.resolve({ docs: [] }) }),
    orderBy: () => ({ get: () => Promise.resolve({ docs: [] }) }),
    limit: () => ({ get: () => Promise.resolve({ docs: [] }) })
  })
};

const mockAuth = {
  verifyIdToken: () => Promise.resolve({ uid: 'mock-user', email: 'mock@example.com' }),
  createUser: () => Promise.resolve({ uid: 'mock-user' }),
  deleteUser: () => Promise.resolve(),
  setCustomUserClaims: () => Promise.resolve()
};

module.exports = admin;
module.exports.db = mockDb;
module.exports.auth = () => mockAuth;
