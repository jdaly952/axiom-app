import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyAIz_lkfpbthiLRc9WO8beb31LemYSyIX8",
  authDomain: "gen-lang-client-0155880326.firebaseapp.com",
  projectId: "gen-lang-client-0155880326",
  storageBucket: "gen-lang-client-0155880326.firebasestorage.app",
  messagingSenderId: "246872621509",
  appId: "1:246872621509:web:ce4465f29970b1f638cbac",
  // Restoring the database ID from the project manifest
  firestoreDatabaseId: "ai-studio-2ea48f28-f943-4d1a-9384-5bc746a41df1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

/**
 * Connectivity test for Firestore. 
 */
import { getDocFromServer, doc } from 'firebase/firestore';

export async function testFirebaseConnection(): Promise<boolean> {
  try {
    // Attempt to fetch a non-existent doc from the server specifically to test the link
    // We use a path allowed in rules for reading
    await getDocFromServer(doc(db, '_internal_', 'connection_test'));
    console.log("Firebase Engine: Connection established.");
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firebase Engine: Connectivity error detected. Check config or authorized domains.");
    }
    // We return true if it's NOT a connectivity error (e.g. permission denied on _internal_ is fine, it means we reached the server)
    // Permission denied on _internal_ actually proves we are ONLINE.
    const isOffline = error instanceof Error && error.message.includes('the client is offline');
    return !isOffline;
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  let message = error instanceof Error ? error.message : String(error);
  
  // Specific guidance for "offline" error which usually means domain/config mismatch
  if (message.includes('the client is offline')) {
    const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    message = `FIREBASE ENGINE: Connection Failed. Your current domain (${currentDomain}) might not be in the 'Authorized Domains' list in your Firebase project. Please add it at: https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`;
  }

  const errInfo: FirestoreErrorInfo = {
    error: message,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
