import { ReactNode, useEffect, useState } from 'react'
import { auth, isDemoFirebase } from '../services/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { Navigate } from 'react-router-dom'

export function Protected({ children }: { children: ReactNode }) {
	const [ready, setReady] = useState(false)
	const [authed, setAuthed] = useState(false)

	useEffect(() => {
		if (isDemoFirebase) {
			setAuthed(true)
			setReady(true)
			return
		}
		const unsub = onAuthStateChanged(auth, (u) => {
			setAuthed(!!u)
			setReady(true)
		})
		return () => unsub()
	}, [])

	if (!ready) return <div>Loading...</div>
	if (!authed) return <Navigate to="/" replace />
	return <>{children}</>
}

