/** Log non-fatal gaps in production configuration (DATABASE_URL is validated separately in initSequelize). */
export function logProductionEnvStatus(): void {
	if (process.env.NODE_ENV !== 'production') return

	const warnings: string[] = []
	if (!process.env.CORS_ORIGIN?.trim()) {
		warnings.push('CORS_ORIGIN is unset — set to your Vercel origin(s) or browsers may block API calls')
	}

	const hasFirebase =
		(process.env.FIREBASE_SERVICE_ACCOUNT && process.env.FIREBASE_SERVICE_ACCOUNT !== 'demo') ||
		(Boolean(process.env.FIREBASE_PROJECT_ID?.trim()) &&
			Boolean(process.env.FIREBASE_CLIENT_EMAIL?.trim()) &&
			Boolean(process.env.FIREBASE_PRIVATE_KEY?.trim()))

	if (!hasFirebase) {
		warnings.push(
			'Firebase Admin is not configured — set FIREBASE_SERVICE_ACCOUNT (JSON) or FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY; otherwise auth runs in demo mode'
		)
	}

	if (warnings.length) {
		console.warn('[env]', warnings.join('\n[env] '))
	} else {
		console.log('[env] CORS_ORIGIN and Firebase admin variables are set')
	}
}
