import admin from 'firebase-admin'
import { Request, Response, NextFunction } from 'express'

let firebaseInitialized = false
let isDemoMode = false

if (!admin.apps.length) {
	const credentialsJson = process.env.FIREBASE_SERVICE_ACCOUNT

	// Try JSON blob first, then individual env vars as fallback
	let serviceAccount: any | null = null
	if (credentialsJson && credentialsJson !== 'demo') {
		try {
			serviceAccount = JSON.parse(credentialsJson)
		} catch (e) {
			console.warn('Invalid FIREBASE_SERVICE_ACCOUNT JSON. Falling back to env vars.')
		}
	}

	if (!serviceAccount) {
		const projectId = process.env.FIREBASE_PROJECT_ID
		const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
		let privateKey = process.env.FIREBASE_PRIVATE_KEY
		if (privateKey) {
			// Handle escaped newlines from .env files
			privateKey = privateKey.replace(/\\n/g, '\n')
		}
		if (projectId && clientEmail && privateKey) {
			serviceAccount = {
				project_id: projectId,
				client_email: clientEmail,
				private_key: privateKey,
			}
		}
	}

	if (serviceAccount && serviceAccount.private_key) {
		// Normalize private_key newlines if provided via JSON string
		if (typeof serviceAccount.private_key === 'string') {
			serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n')
		}
		try {
			const credential = admin.credential.cert(serviceAccount)
			admin.initializeApp({ credential })
			firebaseInitialized = true
		} catch (error) {
			console.warn('Failed to initialize Firebase Admin, running in demo mode:', error)
			isDemoMode = true
		}
	} else {
		console.warn('Firebase credentials not set, running in demo mode')
		isDemoMode = true
	}
}

export const verifyFirebaseToken = async (req: Request, res: Response, next: NextFunction) => {
	if (isDemoMode || !firebaseInitialized) {
		// Demo mode: extract UID from token or use a default
		const authHeader = req.headers.authorization
		const emailHeader = req.headers['x-user-email'] as string | undefined
		const emailQuery = req.query.email as string | undefined
		const emailBody = (req.body as any)?.email as string | undefined
		
		// Get email from header, query, or body
		const email = emailHeader || emailQuery || emailBody
		
		if (authHeader) {
			const token = authHeader.replace('Bearer ', '')
			// In demo mode, use the token itself or a hash as the UID
			;(req as any).uid = token.length > 10 ? token.substring(0, 36) : 'demo-user-id'
		} else {
			// Allow requests without auth in demo mode
			;(req as any).uid = 'demo-user-id'
		}
		
		// Store email for user lookup
		if (email) {
			;(req as any).email = email
		}
		
		return next()
	}

	const authHeader = req.headers.authorization
	if (!authHeader) return res.status(401).json({ error: 'No authorization header' })
	const token = authHeader.replace('Bearer ', '')
	try {
		const decoded = await admin.auth().verifyIdToken(token)
		;(req as any).uid = decoded.uid
		next()
	} catch (e) {
		return res.status(401).json({ error: 'Invalid token' })
	}
}

