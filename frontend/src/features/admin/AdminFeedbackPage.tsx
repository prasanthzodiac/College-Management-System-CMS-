import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import api, { setDemoEmail } from '../../lib/api'
import { isDemoFirebase } from '../../services/firebase'
import DataTable, { Column } from '../../components/DataTable'

type FeedbackEntry = {
	id: string
	studentId: string
	category: string
	subject: string
	message: string
	rating: number
	attachmentUrl?: string | null
	createdAt: string
	student?: {
		id: string
		name: string | null
		email: string
	}
}

export function AdminFeedbackPage() {
	const [feedbacks, setFeedbacks] = useState<FeedbackEntry[]>([])
	const [loading, setLoading] = useState(false)

	useEffect(() => {
		loadFeedbacks()
	}, [])

	const loadFeedbacks = async () => {
		setLoading(true)
		try {
			const email = localStorage.getItem('demoEmail')
			if (isDemoFirebase && email) setDemoEmail(email)
			const { data } = await api.get('/api/feedback/all')
			const items = (data?.items || []) as FeedbackEntry[]
			setFeedbacks(items)
		} catch (err: any) {
			toast.error(err?.response?.data?.error || 'Failed to load feedbacks')
			setFeedbacks([])
		} finally {
			setLoading(false)
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

	const renderStars = (rating: number) => {
		return '★'.repeat(rating) + '☆'.repeat(5 - rating)
	}

	const columns: Column<FeedbackEntry>[] = [
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
			key: 'subject',
			header: 'Subject'
		},
		{
			key: 'message',
			header: 'Message',
			render: (row) => (
				<div className="max-w-xs truncate" title={row.message}>
					{row.message}
				</div>
			)
		},
		{
			key: 'rating',
			header: 'Rating',
			render: (row) => (
				<div className="flex items-center gap-1">
					<span className="text-yellow-500">{renderStars(row.rating)}</span>
					<span className="text-xs text-gray-500">({row.rating}/5)</span>
				</div>
			)
		},
		{
			key: 'createdAt',
			header: 'Date',
			render: (row) => formatDate(row.createdAt)
		},
		{
			key: 'attachmentUrl',
			header: 'Attachment',
			render: (row) => (
				row.attachmentUrl ? (
					<a href={row.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline text-sm">
						View
					</a>
				) : (
					<span className="text-gray-400">—</span>
				)
			)
		}
	]

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between mb-4">
				<div>
					<h2 className="text-xl font-semibold">Student Feedback</h2>
					<p className="text-sm text-gray-600">View and manage all student feedback</p>
				</div>
				<button
					onClick={loadFeedbacks}
					disabled={loading}
					className="px-3 py-1.5 text-sm rounded border hover:bg-gray-100 disabled:opacity-50"
				>
					{loading ? 'Loading...' : 'Refresh'}
				</button>
			</div>

			<DataTable
				title="Feedback Entries"
				columns={columns}
				rows={feedbacks}
				pageSize={10}
			/>
		</div>
	)
}

