import { useEffect, useState } from 'react'
import { auth } from '../services/firebase'
import socket from '../services/socket'

type AttendanceUpdate = {
	sessionId: string
	studentId: string
	present: boolean
	subjectId?: string
	date?: string
	period?: string
}

export function useRealtimeAttendance(studentId: string | null) {
	const [updates, setUpdates] = useState<AttendanceUpdate[]>([])

	useEffect(() => {
		if (!studentId) return

		// Join student room for real-time updates
		socket.emit('attendance:join', { studentId })

		const handleUpdate = (data: AttendanceUpdate) => {
			if (data.studentId === studentId) {
				setUpdates(prev => [data, ...prev])
				// Trigger a refresh or update the UI
				window.dispatchEvent(new CustomEvent('attendance:refresh'))
			}
		}

		socket.on('attendance:updated', handleUpdate)

		return () => {
			socket.off('attendance:updated', handleUpdate)
			socket.emit('attendance:leave', { studentId })
		}
	}, [studentId])

	return { updates }
}

