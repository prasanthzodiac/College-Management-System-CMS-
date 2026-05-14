import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import api, { setDemoEmail } from '../../lib/api'
import { isDemoFirebase } from '../../services/firebase'
import DataTable, { Column } from '../../components/DataTable'

type GrievanceEntry = {
	id: string
	studentId: string
	category: string
	subCategory: string
	location: string | null
	placeName: string | null
	subject: string
	description: string
	fromDate: string | null
	toDate: string | null
	status: 'open' | 'closed'
	createdAt: string
	updatedAt: string
	student?: {
		id: string
		name: string | null
		email: string
	}
}

export function AdminGrievancePage() {
	const [grievances, setGrievances] = useState<GrievanceEntry[]>([])
	const [loading, setLoading] = useState(false)
	const [viewItem, setViewItem] = useState<GrievanceEntry | null>(null)

	useEffect(() => {
		loadGrievances()
	}, [])

	const loadGrievances = async () => {
		setLoading(true)
		try {
			const email = localStorage.getItem('demoEmail')
			if (isDemoFirebase && email) setDemoEmail(email)
			const { data } = await api.get('/api/grievances/all')
			const items = (data?.items || []) as GrievanceEntry[]
			setGrievances(items)
		} catch (err: any) {
			toast.error(err?.response?.data?.error || 'Failed to load grievances')
			setGrievances([])
		} finally {
			setLoading(false)
		}
	}

	const handleResolve = async (id: string, currentStatus: 'open' | 'closed') => {
		const newStatus = currentStatus === 'open' ? 'closed' : 'open'
		try {
			const email = localStorage.getItem('demoEmail')
			if (isDemoFirebase && email) setDemoEmail(email)
			await api.put(`/api/grievances/${id}/status`, { status: newStatus })
			toast.success(`Grievance ${newStatus === 'closed' ? 'resolved' : 'reopened'} successfully`)
			await loadGrievances()
		} catch (err: any) {
			toast.error(err?.response?.data?.error || 'Failed to update grievance status')
		}
	}

	const formatDate = (dateStr: string | null) => {
		if (!dateStr) return '—'
		return new Date(dateStr).toLocaleDateString('en-GB', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		})
	}

	const columns: Column<GrievanceEntry>[] = [
		{
			key: 'id',
			header: 'ID',
			render: (row) => <span className="text-xs font-mono">{row.id.substring(0, 8)}...</span>
		},
		{
			key: 'studentId',
			header: 'Student',
			render: (row) => (
				<div>
					<div className="font-medium">{row.student?.name || 'N/A'}</div>
					<div className="text-xs text-gray-500">{row.student?.email || row.studentId}</div>
				</div>
			)
		},
		{
			key: 'category',
			header: 'Category'
		},
		{
			key: 'subCategory',
			header: 'Sub Category'
		},
		{
			key: 'subject',
			header: 'Subject',
			render: (row) => (
				<div className="max-w-xs truncate" title={row.subject}>
					{row.subject}
				</div>
			)
		},
		{
			key: 'status',
			header: 'Status',
			render: (row) => (
				<span className={`px-2 py-1 text-xs rounded ${
					row.status === 'open' 
						? 'bg-orange-100 text-orange-800' 
						: 'bg-green-100 text-green-800'
				}`}>
					{row.status === 'open' ? 'Open' : 'Closed'}
				</span>
			)
		},
		{
			key: 'createdAt',
			header: 'Date',
			render: (row) => formatDate(row.createdAt)
		},
		{
			key: 'actions',
			header: 'Actions',
			sortable: false,
			render: (row) => (
				<div className="flex items-center gap-2">
					<button
						onClick={() => setViewItem(row)}
						className="px-2 py-1 text-xs rounded border hover:bg-gray-100"
						title="View Details"
					>
						View
					</button>
					<button
						onClick={() => handleResolve(row.id, row.status)}
						className={`px-2 py-1 text-xs rounded ${
							row.status === 'open'
								? 'bg-green-600 text-white hover:bg-green-700'
								: 'bg-orange-600 text-white hover:bg-orange-700'
						}`}
						title={row.status === 'open' ? 'Resolve' : 'Reopen'}
					>
						{row.status === 'open' ? 'Resolve' : 'Reopen'}
					</button>
				</div>
			)
		}
	]

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between mb-4">
				<div>
					<h2 className="text-xl font-semibold">Student Grievances</h2>
					<p className="text-sm text-gray-600">View and manage all student grievances</p>
				</div>
				<button
					onClick={loadGrievances}
					disabled={loading}
					className="px-3 py-1.5 text-sm rounded border hover:bg-gray-100 disabled:opacity-50"
				>
					{loading ? 'Loading...' : 'Refresh'}
				</button>
			</div>

			<DataTable
				title="Grievance Entries"
				columns={columns}
				rows={grievances}
				pageSize={10}
			/>

			{/* View Details Modal */}
			{viewItem && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setViewItem(null)}>
					<div className="w-full max-w-3xl rounded-md bg-white shadow-lg border m-4" onClick={(e) => e.stopPropagation()}>
						<div className="flex items-center justify-between px-4 py-2 bg-blue-700 text-white rounded-t-md">
							<h3 className="font-semibold">Grievance Details</h3>
							<button onClick={() => setViewItem(null)} className="text-white hover:text-gray-200">
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
									<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
								</svg>
							</button>
						</div>
						<div className="p-4 text-sm space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<div className="text-xs text-gray-600 mb-1">Student</div>
									<div className="font-medium">{viewItem.student?.name || 'N/A'}</div>
									<div className="text-xs text-gray-500">{viewItem.student?.email || viewItem.studentId}</div>
								</div>
								<div>
									<div className="text-xs text-gray-600 mb-1">Status</div>
									<span className={`px-2 py-1 text-xs rounded inline-block ${
										viewItem.status === 'open' 
											? 'bg-orange-100 text-orange-800' 
											: 'bg-green-100 text-green-800'
									}`}>
										{viewItem.status === 'open' ? 'Open' : 'Closed'}
									</span>
								</div>
								<div>
									<div className="text-xs text-gray-600 mb-1">Category</div>
									<div className="font-medium">{viewItem.category}</div>
								</div>
								<div>
									<div className="text-xs text-gray-600 mb-1">Sub Category</div>
									<div className="font-medium">{viewItem.subCategory}</div>
								</div>
								<div>
									<div className="text-xs text-gray-600 mb-1">Subject</div>
									<div className="font-medium">{viewItem.subject}</div>
								</div>
								<div>
									<div className="text-xs text-gray-600 mb-1">Location</div>
									<div className="font-medium">{viewItem.location || '—'}</div>
								</div>
								<div>
									<div className="text-xs text-gray-600 mb-1">Place/Item Name</div>
									<div className="font-medium">{viewItem.placeName || '—'}</div>
								</div>
								<div>
									<div className="text-xs text-gray-600 mb-1">Available From</div>
									<div className="font-medium">{formatDate(viewItem.fromDate)}</div>
								</div>
								<div>
									<div className="text-xs text-gray-600 mb-1">Available To</div>
									<div className="font-medium">{formatDate(viewItem.toDate)}</div>
								</div>
								<div className="md:col-span-2">
									<div className="text-xs text-gray-600 mb-1">Description</div>
									<div className="font-medium whitespace-pre-wrap bg-gray-50 p-3 rounded border">{viewItem.description}</div>
								</div>
								<div>
									<div className="text-xs text-gray-600 mb-1">Created At</div>
									<div className="font-medium">{formatDate(viewItem.createdAt)}</div>
								</div>
								<div>
									<div className="text-xs text-gray-600 mb-1">Last Updated</div>
									<div className="font-medium">{formatDate(viewItem.updatedAt)}</div>
								</div>
							</div>
						</div>
						<div className="px-4 py-3 border-t flex items-center justify-end gap-2">
							<button
								onClick={() => handleResolve(viewItem.id, viewItem.status)}
								className={`px-4 py-2 text-sm rounded ${
									viewItem.status === 'open'
										? 'bg-green-600 text-white hover:bg-green-700'
										: 'bg-orange-600 text-white hover:bg-orange-700'
								}`}
							>
								{viewItem.status === 'open' ? 'Resolve Grievance' : 'Reopen Grievance'}
							</button>
							<button
								onClick={() => setViewItem(null)}
								className="px-4 py-2 text-sm rounded border hover:bg-gray-100"
							>
								Close
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

