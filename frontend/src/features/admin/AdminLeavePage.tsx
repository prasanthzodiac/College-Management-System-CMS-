import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import api, { setDemoEmail } from '../../lib/api'
import { isDemoFirebase } from '../../services/firebase'
import DataTable, { Column } from '../../components/DataTable'

type LeaveRequestEntry = {
	id: string
	studentId: string
	fromDate: string
	toDate: string | null
	session: 'FN' | 'AN' | 'Full Day'
	type: string
	reason: string | null
	halfday: boolean
	hourly: boolean
	status: 'pending' | 'approved' | 'rejected'
	createdAt: string
	updatedAt: string
	student?: {
		id: string
		name: string | null
		email: string
	}
}

export function AdminLeavePage() {
	const [leaves, setLeaves] = useState<LeaveRequestEntry[]>([])
	const [loading, setLoading] = useState(false)
	const [viewItem, setViewItem] = useState<LeaveRequestEntry | null>(null)

	useEffect(() => {
		loadLeaves()
	}, [])

	const loadLeaves = async () => {
		setLoading(true)
		try {
			const email = localStorage.getItem('demoEmail')
			if (isDemoFirebase && email) setDemoEmail(email)
			const { data } = await api.get('/api/leaves/all')
			const items = (data?.items || []) as LeaveRequestEntry[]
			setLeaves(items)
		} catch (err: any) {
			toast.error(err?.response?.data?.error || 'Failed to load leave requests')
			setLeaves([])
		} finally {
			setLoading(false)
		}
	}

	const handleApprove = async (id: string) => {
		try {
			const email = localStorage.getItem('demoEmail')
			if (isDemoFirebase && email) setDemoEmail(email)
			await api.put(`/api/leaves/${id}/status`, { status: 'approved' })
			toast.success('Leave request approved successfully')
			await loadLeaves()
		} catch (err: any) {
			toast.error(err?.response?.data?.error || 'Failed to approve leave request')
		}
	}

	const handleReject = async (id: string) => {
		try {
			const email = localStorage.getItem('demoEmail')
			if (isDemoFirebase && email) setDemoEmail(email)
			await api.put(`/api/leaves/${id}/status`, { status: 'rejected' })
			toast.success('Leave request rejected successfully')
			await loadLeaves()
		} catch (err: any) {
			toast.error(err?.response?.data?.error || 'Failed to reject leave request')
		}
	}

	const formatDate = (dateStr: string | null) => {
		if (!dateStr) return '—'
		return new Date(dateStr).toLocaleDateString('en-GB', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		})
	}

	const formatDateTime = (dateStr: string | null) => {
		if (!dateStr) return '—'
		return new Date(dateStr).toLocaleDateString('en-GB', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		})
	}

	const columns: Column<LeaveRequestEntry>[] = [
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
			key: 'fromDate',
			header: 'From Date',
			render: (row) => formatDate(row.fromDate)
		},
		{
			key: 'toDate',
			header: 'To Date',
			render: (row) => formatDate(row.toDate)
		},
		{
			key: 'session',
			header: 'Session'
		},
		{
			key: 'type',
			header: 'Leave Type'
		},
		{
			key: 'status',
			header: 'Status',
			render: (row) => (
				<span className={`px-2 py-1 text-xs rounded ${
					row.status === 'pending' 
						? 'bg-yellow-100 text-yellow-800' 
						: row.status === 'approved'
						? 'bg-green-100 text-green-800'
						: 'bg-red-100 text-red-800'
				}`}>
					{row.status === 'pending' ? 'Pending' : row.status === 'approved' ? 'Approved' : 'Rejected'}
				</span>
			)
		},
		{
			key: 'createdAt',
			header: 'Requested Date',
			render: (row) => formatDateTime(row.createdAt)
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
					{row.status === 'pending' && (
						<>
							<button
								onClick={() => handleApprove(row.id)}
								className="px-2 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700"
								title="Approve"
							>
								Approve
							</button>
							<button
								onClick={() => handleReject(row.id)}
								className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700"
								title="Reject"
							>
								Reject
							</button>
						</>
					)}
				</div>
			)
		}
	]

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between mb-4">
				<div>
					<h2 className="text-xl font-semibold">Leave Approval</h2>
					<p className="text-sm text-gray-600">Review and approve/reject all student leave requests</p>
				</div>
				<button
					onClick={loadLeaves}
					disabled={loading}
					className="px-3 py-1.5 text-sm rounded border hover:bg-gray-100 disabled:opacity-50"
				>
					{loading ? 'Loading...' : 'Refresh'}
				</button>
			</div>

			<DataTable
				title="Leave Requests"
				columns={columns}
				rows={leaves}
				pageSize={10}
			/>

			{/* View Details Modal */}
			{viewItem && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setViewItem(null)}>
					<div className="w-full max-w-3xl rounded-md bg-white shadow-lg border m-4" onClick={(e) => e.stopPropagation()}>
						<div className="flex items-center justify-between px-4 py-2 bg-blue-700 text-white rounded-t-md">
							<h3 className="font-semibold">Leave Request Details</h3>
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
										viewItem.status === 'pending' 
											? 'bg-yellow-100 text-yellow-800' 
											: viewItem.status === 'approved'
											? 'bg-green-100 text-green-800'
											: 'bg-red-100 text-red-800'
									}`}>
										{viewItem.status === 'pending' ? 'Pending' : viewItem.status === 'approved' ? 'Approved' : 'Rejected'}
									</span>
								</div>
								<div>
									<div className="text-xs text-gray-600 mb-1">From Date</div>
									<div className="font-medium">{formatDate(viewItem.fromDate)}</div>
								</div>
								<div>
									<div className="text-xs text-gray-600 mb-1">To Date</div>
									<div className="font-medium">{formatDate(viewItem.toDate)}</div>
								</div>
								<div>
									<div className="text-xs text-gray-600 mb-1">Session</div>
									<div className="font-medium">{viewItem.session}</div>
								</div>
								<div>
									<div className="text-xs text-gray-600 mb-1">Leave Type</div>
									<div className="font-medium">{viewItem.type}</div>
								</div>
								<div>
									<div className="text-xs text-gray-600 mb-1">Half Day</div>
									<div className="font-medium">{viewItem.halfday ? 'Yes' : 'No'}</div>
								</div>
								<div>
									<div className="text-xs text-gray-600 mb-1">Hourly</div>
									<div className="font-medium">{viewItem.hourly ? 'Yes' : 'No'}</div>
								</div>
								<div className="md:col-span-2">
									<div className="text-xs text-gray-600 mb-1">Reason</div>
									<div className="font-medium whitespace-pre-wrap bg-gray-50 p-3 rounded border">{viewItem.reason || '—'}</div>
								</div>
								<div>
									<div className="text-xs text-gray-600 mb-1">Requested At</div>
									<div className="font-medium">{formatDateTime(viewItem.createdAt)}</div>
								</div>
								<div>
									<div className="text-xs text-gray-600 mb-1">Last Updated</div>
									<div className="font-medium">{formatDateTime(viewItem.updatedAt)}</div>
								</div>
							</div>
						</div>
						<div className="px-4 py-3 border-t flex items-center justify-end gap-2">
							{viewItem.status === 'pending' && (
								<>
									<button
										onClick={() => {
											handleApprove(viewItem.id)
											setViewItem(null)
										}}
										className="px-4 py-2 text-sm rounded bg-green-600 text-white hover:bg-green-700"
									>
										Approve
									</button>
									<button
										onClick={() => {
											handleReject(viewItem.id)
											setViewItem(null)
										}}
										className="px-4 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700"
									>
										Reject
									</button>
								</>
							)}
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

