import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import api, { setDemoEmail } from '../../lib/api'
import { isDemoFirebase } from '../../services/firebase'
import DataTable, { Column } from '../../components/DataTable'

type CertificateRequest = {
	id: string
	studentId: string
	certificateType: string
	purpose: string
	status: 'pending' | 'approved' | 'rejected' | 'completed'
	remarks?: string | null
	processedBy?: string | null
	processedAt?: string | null
	createdAt: string
	student?: {
		id: string
		name: string | null
		email: string
	}
}

export function AdmissionPage() {
	const [requests, setRequests] = useState<CertificateRequest[]>([])
	const [loading, setLoading] = useState(false)
	const [selectedRequest, setSelectedRequest] = useState<CertificateRequest | null>(null)
	const [status, setStatus] = useState('')
	const [remarks, setRemarks] = useState('')

	useEffect(() => {
		loadRequests()
	}, [])

	const loadRequests = async () => {
		setLoading(true)
		try {
			const email = localStorage.getItem('demoEmail')
			if (isDemoFirebase && email) setDemoEmail(email)
			const { data } = await api.get('/api/certificates')
			setRequests(data?.requests || [])
		} catch (err: any) {
			toast.error(err?.response?.data?.error || 'Failed to load certificate requests')
			setRequests([])
		} finally {
			setLoading(false)
		}
	}

	const handleStatusUpdate = async () => {
		if (!selectedRequest || !status) {
			toast.error('Please select a status')
			return
		}

		try {
			const email = localStorage.getItem('demoEmail')
			if (isDemoFirebase && email) setDemoEmail(email)
			await api.patch(`/api/certificates/${selectedRequest.id}`, {
				status,
				remarks: remarks || undefined
			})
			toast.success('Request updated successfully')
			setSelectedRequest(null)
			setStatus('')
			setRemarks('')
			loadRequests()
		} catch (err: any) {
			toast.error(err?.response?.data?.error || 'Failed to update request')
		}
	}

	const formatDate = (dateStr: string) => {
		return new Date(dateStr).toLocaleDateString('en-GB', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		})
	}

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'pending': return 'bg-yellow-100 text-yellow-800'
			case 'approved': return 'bg-blue-100 text-blue-800'
			case 'rejected': return 'bg-red-100 text-red-800'
			case 'completed': return 'bg-green-100 text-green-800'
			default: return 'bg-gray-100 text-gray-800'
		}
	}

	const columns: Column<CertificateRequest>[] = [
		{
			key: 'id',
			header: 'Request ID',
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
			key: 'certificateType',
			header: 'Certificate Type'
		},
		{
			key: 'purpose',
			header: 'Purpose',
			render: (row) => (
				<div className="max-w-xs truncate" title={row.purpose}>
					{row.purpose}
				</div>
			)
		},
		{
			key: 'status',
			header: 'Status',
			render: (row) => (
				<span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(row.status)}`}>
					{row.status.toUpperCase()}
				</span>
			)
		},
		{
			key: 'createdAt',
			header: 'Requested Date',
			render: (row) => formatDate(row.createdAt)
		},
		{
			key: 'status',
			header: 'Actions',
			render: (row) => (
				<button
					onClick={() => {
						setSelectedRequest(row)
						setStatus(row.status)
						setRemarks(row.remarks || '')
					}}
					className="text-blue-700 hover:underline text-sm"
				>
					Update Status
				</button>
			)
		}
	]

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between mb-4">
				<div>
					<h2 className="text-xl font-semibold">Certificate Requests</h2>
					<p className="text-sm text-gray-600">Manage student certificate requests</p>
				</div>
				<button
					onClick={loadRequests}
					disabled={loading}
					className="px-3 py-1.5 text-sm rounded border hover:bg-gray-100 disabled:opacity-50"
				>
					{loading ? 'Loading...' : 'Refresh'}
				</button>
			</div>

			<DataTable
				title="Certificate Requests"
				columns={columns}
				rows={requests}
				pageSize={10}
			/>

			{selectedRequest && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
					<div className="w-full max-w-2xl rounded-md bg-white shadow-lg border m-4">
						<div className="flex items-center justify-between px-4 py-2 bg-blue-700 text-white rounded-t-md">
							<h3 className="font-semibold">Update Certificate Request Status</h3>
							<button
								onClick={() => {
									setSelectedRequest(null)
									setStatus('')
									setRemarks('')
								}}
								className="text-white hover:text-gray-200"
							>
								✕
							</button>
						</div>
						<div className="p-4 space-y-4 text-sm">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<div className="text-xs text-gray-500 mb-1">Student</div>
									<div className="font-medium">{selectedRequest.student?.name || 'N/A'}</div>
									<div className="text-xs text-gray-600">{selectedRequest.student?.email}</div>
								</div>
								<div>
									<div className="text-xs text-gray-500 mb-1">Certificate Type</div>
									<div className="font-medium">{selectedRequest.certificateType}</div>
								</div>
							</div>
							<div>
								<div className="text-xs text-gray-500 mb-1">Purpose</div>
								<div className="p-2 bg-gray-50 rounded border">{selectedRequest.purpose}</div>
							</div>
							<div>
								<label className="block font-medium mb-1">* Status</label>
								<select
									value={status}
									onChange={(e) => setStatus(e.target.value)}
									className="w-full border rounded px-3 py-2 bg-white"
								>
									<option value="pending">Pending</option>
									<option value="approved">Approved</option>
									<option value="rejected">Rejected</option>
									<option value="completed">Completed</option>
								</select>
							</div>
							<div>
								<label className="block font-medium mb-1">Remarks</label>
								<textarea
									value={remarks}
									onChange={(e) => setRemarks(e.target.value)}
									placeholder="Add any remarks or notes..."
									rows={3}
									className="w-full border rounded px-3 py-2 bg-white"
								/>
							</div>
							<div className="flex items-center gap-2 pt-2">
								<button
									onClick={handleStatusUpdate}
									className="px-4 py-2 rounded bg-blue-700 text-white hover:bg-blue-800"
								>
									Update Status
								</button>
								<button
									onClick={() => {
										setSelectedRequest(null)
										setStatus('')
										setRemarks('')
									}}
									className="px-4 py-2 rounded border hover:bg-gray-100"
								>
									Cancel
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

