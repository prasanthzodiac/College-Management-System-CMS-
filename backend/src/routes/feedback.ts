import { Router } from 'express'
import { randomUUID } from 'crypto'
import { verifyFirebaseToken } from '../services/firebaseAdmin.js'
import { Feedback } from '../models/Feedback.js'
import { User } from '../models/User.js'

export const feedbackRouter = Router()

const resolveStudentId = async (uid: string, email?: string) => {
  if (email) {
    const u = await User.findOne({ where: { email } })
    if (u) return u.id
  }
  return uid
}

feedbackRouter.get('/', verifyFirebaseToken, async (req, res) => {
  const uid = (req as any).uid as string
  const email = (req as any).email as string | undefined
  const studentId = await resolveStudentId(uid, email)
  const items = await Feedback.findAll({ where: { studentId }, order: [['createdAt', 'DESC']] })
  return res.json({ items })
})

feedbackRouter.post('/', verifyFirebaseToken, async (req, res) => {
  const uid = (req as any).uid as string
  const email = (req as any).email as string | undefined
  const studentId = await resolveStudentId(uid, email)
  const { category, subject, message, rating, attachmentUrl } = req.body as any
  if (!category || !subject || !message || !rating) return res.status(400).json({ error: 'Missing fields' })
  const item = await Feedback.create({ id: randomUUID(), studentId, category, subject, message, rating, attachmentUrl: attachmentUrl || null })
  return res.json({ ok: true, item })
})

// Staff/Admin: fetch all feedback with student details
feedbackRouter.get('/all', verifyFirebaseToken, async (req, res) => {
  try {
    const uid = (req as any).uid as string
    const email = (req as any).email as string | undefined

    // Resolve current user (prefer email in demo mode)
    let staff = null as any
    if (email) {
      staff = await User.findOne({ where: { email } })
      // If no user exists but we have an email, auto-create with inferred role (demo-friendly)
      if (!staff) {
        const lower = email.toLowerCase()
        let role: 'student' | 'staff' | 'admin' = 'student'
        if (lower.startsWith('staff@') || lower.split('@')[0].startsWith('staff')) role = 'staff'
        if (lower.startsWith('admin@') || lower.split('@')[0].startsWith('admin')) role = 'admin'
        const friendlyName = lower.split('@')[0]
        staff = await User.create({ id: uid, email, name: friendlyName, role })
      }
    }
    if (!staff) staff = await User.findByPk(uid)
    if (!staff || (staff.role !== 'staff' && staff.role !== 'admin')) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    const items = await Feedback.findAll({ order: [['createdAt', 'DESC']] })

    // Attach basic student info for each feedback
    const studentIds = Array.from(new Set(items.map((f: any) => f.studentId)))
    const students = await User.findAll({ where: { id: studentIds } as any })
    const byId: Record<string, any> = {}
    for (const s of students) byId[s.id] = s

    const rows = items.map((f: any) => ({
      id: f.id,
      studentId: f.studentId,
      category: f.category,
      subject: f.subject,
      message: f.message,
      rating: f.rating,
      attachmentUrl: f.attachmentUrl,
      createdAt: f.createdAt,
      student: byId[f.studentId]
        ? {
            id: byId[f.studentId].id,
            name: byId[f.studentId].name,
            email: byId[f.studentId].email
          }
        : null
    }))

    return res.json({ items: rows })
  } catch (err: any) {
    console.error('Error fetching all feedback:', err)
    return res.status(500).json({ error: err?.message || 'Failed to fetch feedback' })
  }
})


