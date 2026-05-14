import { useEffect, useState } from 'react'
import { auth } from '../services/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { Outlet } from 'react-router-dom'

export function Dashboard() {
	const [email, setEmail] = useState<string | null>(null)

	useEffect(() => {
		const unsub = onAuthStateChanged(auth, (u) => setEmail(u?.email ?? u?.uid ?? null))
		return () => unsub()
	}, [])

	return (
		<div>
			<Outlet />
		</div>
	)
}

