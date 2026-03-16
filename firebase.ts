import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Validate Connection to Firestore
async function testConnection() {
  try {
    // Attempt to fetch a non-existent document to test connectivity
    await getDocFromServer(doc(db, '_connection_test_', 'ping'));
    console.log("Firebase connection successful.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Firebase connection failed: the client is offline. Please check your Firebase configuration.");
    } else {
      // Other errors (like permission denied) are expected if the doc doesn't exist or rules are strict
      console.log("Firebase connection test completed.");
    }
  }
}

testConnection();
