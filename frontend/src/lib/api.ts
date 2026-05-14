import axios, { type InternalAxiosRequestConfig } from 'axios'
import { auth, isDemoFirebase } from '../services/firebase'

const api = axios.create({ baseURL: (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8080' })

// Store email for demo mode
let demoEmail: string | null = null

export const setDemoEmail = (email: string | null) => {
	demoEmail = email
}

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
	const user = auth.currentUser
	
	// Get email from state or localStorage in demo mode
	const email = isDemoFirebase ? (demoEmail || localStorage.getItem('demoEmail')) : null
	
	if (isDemoFirebase && email) {
		// In demo mode, pass email in header
		config.headers = { ...(config.headers as any), 'x-user-email': email } as any
		// Also add a dummy token if no auth header
		if (!config.headers?.Authorization) {
			config.headers = { ...(config.headers as any), Authorization: `Bearer demo-token-${email}` } as any
		}
		// Also add as query param for GET requests
		if (config.method === 'get' && !config.params) {
			config.params = { email }
		} else if (config.method === 'get' && config.params) {
			config.params.email = email
		}
	}
	
	if (user) {
		const token = await user.getIdToken()
		const headers: any = config.headers
		if (headers && typeof headers.set === 'function') {
			headers.set('Authorization', `Bearer ${token}`)
		} else {
			config.headers = { ...(config.headers as any), Authorization: `Bearer ${token}` } as any
		}
	}
	return config
})

export default api

