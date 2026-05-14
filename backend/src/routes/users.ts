import { Router } from 'express'
import { randomUUID } from 'crypto'
import { User } from '../models/User.js'
import { verifyFirebaseToken } from '../services/firebaseAdmin.js'

export const authRouter = Router()

async function resolveUser(uid: string, email?: string) {
	if (email) {
		let user = await User.findOne({ where: { email } })
		if (!user) {
			const lower = email.toLowerCase()
			let role: 'student' | 'staff' | 'admin' = 'student'
			if (lower.startsWith('staff@') || lower.split('@')[0].startsWith('staff')) role = 'staff'
			if (lower.startsWith('admin@') || lower.split('@')[0].startsWith('admin')) role = 'admin'
			const friendlyName = lower.split('@')[0]
			user = await User.create({ id: uid, email, name: friendlyName, role })
		}
		return user
	}
	return User.findByPk(uid)
}

async function ensureAdmin(uid: string, email?: string) {
	const user = await resolveUser(uid, email)
	if (!user || user.role !== 'admin') {
		return null
	}
	return user
}

authRouter.get('/me', verifyFirebaseToken, async (req, res) => {
	const uid = (req as any).uid as string
	const email = (req as any).email as string | undefined
	
	const user = await resolveUser(uid, email)
	
	return res.json({ user })
})

authRouter.post('/sync', verifyFirebaseToken, async (req, res) => {
	const { email, name, photoUrl } = req.body as { email: string; name?: string; photoUrl?: string }
	const uid = (req as any).uid as string
	
	if (!email) {
		return res.status(400).json({ error: 'Email is required' })
	}
	
	// In demo mode, find existing user by email first
	let user = await User.findOne({ where: { email } })
	
	if (user) {
		// Update existing user
		// Only overwrite name if a meaningful value is provided
		const providedName = (name ?? '').toString().trim()
		const isNumericName = /^\d+$/.test(providedName)
		if (providedName && !isNumericName) {
			user.name = providedName
		} else if (!user.name || user.name.trim().length === 0) {
			// If no existing name, derive a friendly one from email
			const prefix = email.split('@')[0]
			const m = prefix.match(/student(\d+)/i)
			user.name = m ? `Student ${m[1]}` : prefix
		}
		user.photoUrl = photoUrl ?? user.photoUrl
		await user.save()
	} else {
		// Create new user with the email's user ID if found, otherwise use uid
		let friendlyName = (name ?? '').toString().trim()
		if (!friendlyName || /^\d+$/.test(friendlyName)) {
			const prefix = email.split('@')[0]
			const m = prefix.match(/student(\d+)/i)
			friendlyName = m ? `Student ${m[1]}` : prefix
		}
		user = await User.create({ 
			id: uid, 
			email, 
			name: friendlyName, 
			photoUrl: photoUrl ?? null 
		})
	}
	
	return res.json({ ok: true, user })
})

// Admin: Get all users
authRouter.get('/all', verifyFirebaseToken, async (req, res) => {
	try {
		const uid = (req as any).uid as string
		const email = (req as any).email as string | undefined

		// Resolve current user (prefer email in demo mode)
		const user = await resolveUser(uid, email)
		if (!user || user.role !== 'admin') {
			return res.status(403).json({ error: 'Unauthorized - Admin access required' })
		}

		const users = await User.findAll({
			order: [['createdAt', 'DESC']],
			attributes: ['id', 'email', 'name', 'role', 'photoUrl', 'createdAt', 'updatedAt']
		})

		return res.json({ users })
	} catch (err: any) {
		console.error('Error fetching users:', err)
		return res.status(500).json({ error: err?.message || 'Failed to fetch users' })
	}
})

authRouter.post('/create', verifyFirebaseToken, async (req, res) => {
	try {
		const uid = (req as any).uid as string
		const email = (req as any).email as string | undefined
		const admin = await ensureAdmin(uid, email)
		if (!admin) {
			return res.status(403).json({ error: 'Unauthorized - Admin access required' })
		}

		const { email: newEmail, name, role } = req.body as { email?: string; name?: string; role?: 'student' | 'staff' | 'admin' }
		if (!newEmail || !role) {
			return res.status(400).json({ error: 'Email and role are required' })
		}

		if (!['student', 'staff', 'admin'].includes(role)) {
			return res.status(400).json({ error: 'Invalid role supplied' })
		}

		const existing = await User.findOne({ where: { email: newEmail } })
		if (existing) {
			return res.status(409).json({ error: 'User with this email already exists' })
		}

		let friendlyName = (name ?? '').toString().trim()
		if (!friendlyName) {
			const prefix = newEmail.split('@')[0]
			const match = prefix.match(/student(\d+)/i)
			friendlyName = match ? `Student ${match[1]}` : prefix
		}

		const user = await User.create({
			id: randomUUID(),
			email: newEmail,
			name: friendlyName,
			role,
			photoUrl: null
		})

		return res.status(201).json({ ok: true, user })
	} catch (error: any) {
		console.error('Error creating user:', error)
		return res.status(500).json({ error: error?.message || 'Failed to create user' })
	}
})

authRouter.delete('/:id', verifyFirebaseToken, async (req, res) => {
	try {
		const uid = (req as any).uid as string
		const email = (req as any).email as string | undefined
		const admin = await ensureAdmin(uid, email)
		if (!admin) {
			return res.status(403).json({ error: 'Unauthorized - Admin access required' })
		}

		const { id } = req.params
		if (!id) {
			return res.status(400).json({ error: 'User id is required' })
		}

		if (id === admin.id) {
			return res.status(400).json({ error: 'You cannot delete your own account' })
		}

		const user = await User.findByPk(id)
		if (!user) {
			return res.status(404).json({ error: 'User not found' })
		}

		if (user.role === 'admin') {
			return res.status(400).json({ error: 'Cannot delete another admin' })
		}

		await user.destroy()
		return res.json({ ok: true })
	} catch (error: any) {
		console.error('Error deleting user:', error)
		return res.status(500).json({ error: error?.message || 'Failed to delete user' })
	}
})

