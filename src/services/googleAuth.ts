import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User as FirebaseUser,
  signOut
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Reuse existing app instance if already initialized
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
];

const provider = new GoogleAuthProvider();
// Add Google Drive and Google Sheets scopes
WORKSPACE_SCOPES.forEach(scope => {
  provider.addScope(scope);
});
provider.setCustomParameters({
  prompt: 'consent',
  access_type: 'offline',
});

// Flag to indicate if we are in the middle of a sign-in flow.
let isSigningIn = false;
// In-memory cache for access token (MANDATORY: never store in localStorage/sessionStorage)
let cachedAccessToken: string | null = null;
let cachedGoogleUser: FirebaseUser | null = null;

// Listeners for auth state change
type AuthListener = (user: FirebaseUser | null, token: string | null) => void;
const listeners: Set<AuthListener> = new Set();

export const subscribeGoogleAuth = (listener: AuthListener) => {
  listeners.add(listener);
  // Initial emit with current state
  listener(cachedGoogleUser, cachedAccessToken);
  return () => {
    listeners.delete(listener);
  };
};

const notifyListeners = () => {
  listeners.forEach(fn => fn(cachedGoogleUser, cachedAccessToken));
};

// Initialize auth state listener. Call this on app load.
export const initGoogleAuth = (
  onAuthSuccess?: (user: FirebaseUser, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
    cachedGoogleUser = user;
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
        notifyListeners();
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
        notifyListeners();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
      notifyListeners();
    }
  });
};

// Must be called from a button click or user interaction
export const signInWithGoogle = async (): Promise<{ user: FirebaseUser; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal memperoleh access token Google dari Firebase Auth');
    }

    cachedAccessToken = credential.accessToken;
    cachedGoogleUser = result.user;
    notifyListeners();
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getGoogleAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const getGoogleUser = (): FirebaseUser | null => {
  return cachedGoogleUser;
};

export const logoutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  cachedGoogleUser = null;
  notifyListeners();
};
