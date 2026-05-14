import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'localhost',
	projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
	appId: import.meta.env.VITE_FIREBASE_APP_ID || 'demo-app-id'
}

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const isDemoFirebase = firebaseConfig.apiKey === 'demo-api-key'

