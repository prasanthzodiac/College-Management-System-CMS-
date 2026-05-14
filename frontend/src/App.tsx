import { Outlet, useLocation } from 'react-router-dom'

export default function App() {
	const location = useLocation()
	const isDashboard = location.pathname.startsWith('/dashboard')

	if (isDashboard) {
		return (
			<div className="min-h-screen">
				<Outlet />
			</div>
		)
	}

	return (
		<div className="min-h-screen">
			<div className="mx-auto max-w-7xl p-6">
				<main className="mt-6">
					<Outlet />
				</main>
			</div>
		</div>
	)
}

