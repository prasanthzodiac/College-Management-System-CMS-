import { Router } from 'express'
import { randomUUID } from 'crypto'
import { verifyFirebaseToken } from '../services/firebaseAdmin.js'
import { CertificateRequest } from '../models/CertificateRequest.js'
import { User } from '../models/User.js'

export const certificateRouter = Router()

// Get all certificate requests (for staff)
certificateRouter.get('/', verifyFirebaseToken, async (req, res) => {
	try {
		const uid = (req as any).uid as string
		const email = (req as any).email as string | undefined

		// Resolve current user (prefer email in demo mode)
		let user = null as any
		if (email) {
			user = await User.findOne({ where: { email } })
			// If no user exists but we have an email, auto-create with inferred role (demo-friendly)
			if (!user) {
				const lower = email.toLowerCase()
				let role: 'student' | 'staff' | 'admin' = 'student'
				if (lower.startsWith('staff@') || lower.split('@')[0].startsWith('staff')) role = 'staff'
				if (lower.startsWith('admin@') || lower.split('@')[0].startsWith('admin')) role = 'admin'
				const friendlyName = lower.split('@')[0]
				user = await User.create({ id: uid, email, name: friendlyName, role })
			}
		}
		if (!user) user = await User.findByPk(uid)
		if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
			return res.status(403).json({ error: 'Unauthorized' })
		}

		const requests = await CertificateRequest.findAll({
			order: [['createdAt', 'DESC']]
		})

		// Fetch student details for each request
		const requestsWithStudents = await Promise.all(
			requests.map(async (req) => {
				const student = await User.findByPk(req.studentId)
				return {
					...req.toJSON(),
					student: student ? {
						id: student.id,
						name: student.name,
						email: student.email
					} : null
				}
			})
		)

		return res.json({ requests: requestsWithStudents })
	} catch (err: any) {
		console.error('Error fetching certificate requests:', err)
		return res.status(500).json({ error: err?.message || 'Failed to fetch certificate requests' })
	}
})

// Get certificate requests for current student
certificateRouter.get('/student/current', verifyFirebaseToken, async (req, res) => {
    const uid = (req as any).uid as string
    const email = (req as any).email as string | undefined

    let user: any = null
    if (email) user = await User.findOne({ where: { email } })
    if (!user) user = await User.findByPk(uid)
    if (!user) return res.status(401).json({ error: 'User not found' })
    if (user.role !== 'student') return res.status(403).json({ error: 'Only students can access this endpoint' })

    const requests = await CertificateRequest.findAll({
        where: { studentId: user.id },
        order: [['createdAt', 'DESC']]
    })
    return res.json({ requests })
})

// Get certificate requests for a specific student (staff/admin only)
certificateRouter.get('/student/:studentId', verifyFirebaseToken, async (req, res) => {
	const { studentId } = req.params
	const uid = (req as any).uid as string

	const user = await User.findByPk(uid)
	if (!user) return res.status(401).json({ error: 'User not found' })
	
	if (user.role !== 'staff' && user.role !== 'admin') {
		return res.status(403).json({ error: 'Unauthorized' })
	}

	const requests = await CertificateRequest.findAll({
		where: { studentId },
		order: [['createdAt', 'DESC']]
	})

	return res.json({ requests })
})

// Create a new certificate request (student)
certificateRouter.post('/', verifyFirebaseToken, async (req, res) => {
    const { certificateType, purpose } = req.body as { certificateType: string; purpose: string }
    const uid = (req as any).uid as string
    const email = (req as any).email as string | undefined

    let user: any = null
    if (email) user = await User.findOne({ where: { email } })
    if (!user) user = await User.findByPk(uid)
    if (!user || user.role !== 'student') return res.status(403).json({ error: 'Only students can create certificate requests' })
    if (!certificateType || !purpose) return res.status(400).json({ error: 'Missing certificateType or purpose' })

    const id = randomUUID()
    const request = await CertificateRequest.create({ id, studentId: user.id, certificateType, purpose, status: 'pending' })
    return res.json({ ok: true, request })
})

// Update certificate request status (staff/admin)
certificateRouter.patch('/:requestId', verifyFirebaseToken, async (req, res) => {
	try {
		const { requestId } = req.params
		const { status, remarks } = req.body as { status?: string; remarks?: string }
		const uid = (req as any).uid as string
		const email = (req as any).email as string | undefined

		// Resolve current user (prefer email in demo mode)
		let user = null as any
		if (email) {
			user = await User.findOne({ where: { email } })
			if (!user) {
				const lower = email.toLowerCase()
				let role: 'student' | 'staff' | 'admin' = 'student'
				if (lower.startsWith('staff@') || lower.split('@')[0].startsWith('staff')) role = 'staff'
				if (lower.startsWith('admin@') || lower.split('@')[0].startsWith('admin')) role = 'admin'
				const friendlyName = lower.split('@')[0]
				user = await User.create({ id: uid, email, name: friendlyName, role })
			}
		}
		if (!user) user = await User.findByPk(uid)
		if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
			return res.status(403).json({ error: 'Unauthorized' })
		}

		const request = await CertificateRequest.findByPk(requestId)
		if (!request) {
			return res.status(404).json({ error: 'Request not found' })
		}

		const updateData: any = {}
		if (status && ['pending', 'approved', 'rejected', 'completed'].includes(status)) {
			updateData.status = status
			updateData.processedBy = user.id
			updateData.processedAt = new Date()
		}
		if (remarks !== undefined) {
			updateData.remarks = remarks
		}

		await request.update(updateData)

		return res.json({ ok: true, request })
	} catch (err: any) {
		console.error('Error updating certificate request:', err)
		return res.status(500).json({ error: err?.message || 'Failed to update certificate request' })
	}
})

// Set up association (if needed)
// CertificateRequest.belongsTo(User, { foreignKey: 'studentId', as: 'student' })

