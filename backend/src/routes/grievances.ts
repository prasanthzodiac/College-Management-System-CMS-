import { Router } from 'express'
import { randomUUID } from 'crypto'
import { verifyFirebaseToken } from '../services/firebaseAdmin.js'
import { Grievance } from '../models/Grievance.js'
import { User } from '../models/User.js'

export const grievancesRouter = Router()

const resolveStudentId = async (uid: string, email?: string) => {
  if (email) {
    const u = await User.findOne({ where: { email } })
    if (u) return u.id
  }
  return uid
}

grievancesRouter.get('/', verifyFirebaseToken, async (req, res) => {
  const uid = (req as any).uid as string
  const email = (req as any).email as string | undefined
  const studentId = await resolveStudentId(uid, email)
  const items = await Grievance.findAll({ where: { studentId }, order: [['createdAt', 'DESC']] })
  return res.json({ items })
})

grievancesRouter.post('/', verifyFirebaseToken, async (req, res) => {
  const uid = (req as any).uid as string
  const email = (req as any).email as string | undefined
  const studentId = await resolveStudentId(uid, email)
  const { category, subCategory, location, placeName, subject, description, fromDate, toDate } = req.body as any
  if (!category || !subCategory || !subject || !description) return res.status(400).json({ error: 'Missing fields' })
  const item = await Grievance.create({ id: randomUUID(), studentId, category, subCategory, location: location || null, placeName: placeName || null, subject, description, fromDate: fromDate || null, toDate: toDate || null, status: 'open' })
  return res.json({ ok: true, item })
})

grievancesRouter.delete('/:id', verifyFirebaseToken, async (req, res) => {
  const { id } = req.params
  const uid = (req as any).uid as string
  const email = (req as any).email as string | undefined
  const studentId = await resolveStudentId(uid, email)
  const item = await Grievance.findByPk(id)
  if (!item || item.studentId !== studentId) return res.status(404).json({ error: 'Not found' })
  await item.destroy()
  return res.json({ ok: true })
})

// Staff/Admin: fetch all grievances with student details
grievancesRouter.get('/all', verifyFirebaseToken, async (req, res) => {
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

    const items = await Grievance.findAll({ order: [['createdAt', 'DESC']] })

    // Attach student info for each grievance
    const studentIds = Array.from(new Set(items.map((g: any) => g.studentId)))
    const students = await User.findAll({ where: { id: studentIds } as any })
    const byId: Record<string, any> = {}
    for (const s of students) byId[s.id] = s

    const rows = items.map((g: any) => ({
      id: g.id,
      studentId: g.studentId,
      category: g.category,
      subCategory: g.subCategory,
      location: g.location,
      placeName: g.placeName,
      subject: g.subject,
      description: g.description,
      fromDate: g.fromDate,
      toDate: g.toDate,
      status: g.status,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
      student: byId[g.studentId]
        ? {
            id: byId[g.studentId].id,
            name: byId[g.studentId].name,
            email: byId[g.studentId].email
          }
        : null
    }))

    return res.json({ items: rows })
  } catch (err: any) {
    console.error('Error fetching all grievances:', err)
    return res.status(500).json({ error: err?.message || 'Failed to fetch grievances' })
  }
})

// Staff/Admin: update grievance status (resolve/close)
grievancesRouter.put('/:id/status', verifyFirebaseToken, async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body as { status: 'open' | 'closed' }
    const uid = (req as any).uid as string
    const email = (req as any).email as string | undefined

    if (!status || (status !== 'open' && status !== 'closed')) {
      return res.status(400).json({ error: 'Invalid status. Must be "open" or "closed"' })
    }

    // Resolve current user (prefer email in demo mode)
    let staff = null as any
    if (email) {
      staff = await User.findOne({ where: { email } })
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

    const item = await Grievance.findByPk(id)
    if (!item) return res.status(404).json({ error: 'Grievance not found' })

    item.status = status
    await item.save()

    return res.json({ ok: true, item })
  } catch (err: any) {
    console.error('Error updating grievance status:', err)
    return res.status(500).json({ error: err?.message || 'Failed to update grievance status' })
  }
})


