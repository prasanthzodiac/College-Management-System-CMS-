import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth, isDemoFirebase } from '../services/firebase'
import api, { setDemoEmail } from '../lib/api'

export function Login() {
	const navigate = useNavigate()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const onEmailLogin = async (e: React.FormEvent) => {
		e.preventDefault()
		setError(null)
		setLoading(true)
		try {
			// Basic validation
			const trimmedEmail = email.trim()
			const trimmedPassword = password.trim()
			if (!trimmedEmail || !trimmedPassword) {
				setError('Please enter both email and password')
				return
			}
			if (isDemoFirebase) {
				// Demo fallback: sync user and navigate
				setDemoEmail(trimmedEmail)
				localStorage.setItem('demoEmail', trimmedEmail)
                try {
                    // Sync user with backend (let backend derive a friendly name)
                    await api.post('/api/auth/sync', { 
                        email: trimmedEmail 
                    })
                } catch (err) {
					console.error('Failed to sync user:', err)
				}
				navigate(resolveDashboardPath(trimmedEmail))
				return
			}
			await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword)
			navigate(resolveDashboardPath(trimmedEmail))
		} catch (e: any) {
			setError(e?.message || 'Login failed')
		} finally {
			setLoading(false)
		}
	}

	function resolveDashboardPath(userEmail: string) {
		const mail = (userEmail || '').toLowerCase()
		if (mail.startsWith('admin@') || (mail.includes('@') && mail.split('@')[0].startsWith('admin'))) return '/dashboard/admin'
		if (mail.startsWith('staff@') || (mail.includes('@') && mail.split('@')[0].startsWith('staff'))) return '/dashboard/staff'
		return '/dashboard/student'
	}



	return (
		<div className="bg-muted/30 py-10">
			<div className="w-full max-w-xl mx-auto">
				<h1 className="text-3xl font-semibold text-center text-blue-700 mb-6">CollegeConnect</h1>
				<div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6">
					<h2 className="text-xl font-medium mb-4">Sign in to start your session</h2>
					<form onSubmit={onEmailLogin} className="space-y-3">
						<label className="block text-sm font-medium">Username *</label>
						<input
							type="email"
							placeholder="Email or Roll Number"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="w-full border rounded-md px-3 py-2 bg-white"
						/>
						<label className="block text-sm font-medium">Password *</label>
						<input
							type="password"
							placeholder="Password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="w-full border rounded-md px-3 py-2 bg-white"
						/>
					{error && <p className="text-sm text-red-600">{error}</p>}
					<button disabled={loading} className="w-full bg-blue-900 hover:bg-blue-800 text-white rounded-md py-2">
							{loading ? 'Signing in...' : 'Sign In'}
						</button>
					</form>
					{isDemoFirebase && (
						<p className="mt-3 text-xs text-gray-500">Demo mode: any credentials will continue.</p>
					)}
				</div>
				<div className="mx-auto mt-4 max-w-md text-xs bg-muted rounded-md p-3 text-center">
					<p>Demo Credentials (Password: 'password')</p>
					<p><span className="font-semibold">Student</span>: student@college.edu</p>
					<p><span className="font-semibold">Staff</span>: staff@college.edu (Dr. John Doe)</p>
					<p><span className="font-semibold">Admin</span>: admin@college.edu</p>
				</div>
			</div>
		</div>
	)
}

