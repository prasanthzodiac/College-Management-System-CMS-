import { Router } from 'express'
import { randomUUID } from 'crypto'
import { verifyFirebaseToken } from '../services/firebaseAdmin.js'
import { LeaveRequest } from '../models/Leave.js'
import { User } from '../models/User.js'

export const leavesRouter = Router()

// List current student's leave requests
leavesRouter.get('/', verifyFirebaseToken, async (req, res) => {
  const uid = (req as any).uid as string
  const email = (req as any).email as string | undefined
  let studentId = uid
  if (email) {
    const user = await User.findOne({ where: { email } })
    if (user) studentId = user.id
  }
  const items = await LeaveRequest.findAll({ where: { studentId }, order: [['createdAt', 'DESC']] })
  return res.json({ items })
})

// Create leave request
leavesRouter.post('/', verifyFirebaseToken, async (req, res) => {
  const uid = (req as any).uid as string
  const email = (req as any).email as string | undefined
  let studentId = uid
  if (email) {
    const u = await User.findOne({ where: { email } })
    if (u) studentId = u.id
  }
  const { fromDate, toDate, session, type, reason, halfday, hourly } = req.body as any
  if (!fromDate || !session || !type) return res.status(400).json({ error: 'Missing fields' })
  const item = await LeaveRequest.create({
    id: randomUUID(),
    studentId,
    fromDate,
    toDate: toDate || null,
    session,
    type,
    reason: reason || null,
    halfday: !!halfday,
    hourly: !!hourly,
    status: 'pending'
  })
  return res.json({ ok: true, item })
})

// Update (rewrite) leave request - only if pending and belongs to student
leavesRouter.put('/:id', verifyFirebaseToken, async (req, res) => {
  const { id } = req.params
  const uid = (req as any).uid as string
  const email = (req as any).email as string | undefined
  let studentId = uid
  if (email) {
    const u = await User.findOne({ where: { email } })
    if (u) studentId = u.id
  }
  const item = await LeaveRequest.findByPk(id)
  if (!item || item.studentId !== studentId) return res.status(404).json({ error: 'Not found' })
  if (item.status !== 'pending') return res.status(400).json({ error: 'Cannot edit processed request' })
  const { fromDate, toDate, session, type, reason, halfday, hourly } = req.body as any
  Object.assign(item, { fromDate, toDate, session, type, reason, halfday, hourly })
  await item.save()
  return res.json({ ok: true, item })
})

// Delete leave request (only own and pending)
leavesRouter.delete('/:id', verifyFirebaseToken, async (req, res) => {
  const { id } = req.params
  const uid = (req as any).uid as string
  const email = (req as any).email as string | undefined
  let studentId = uid
  if (email) {
    const u = await User.findOne({ where: { email } })
    if (u) studentId = u.id
  }
  const item = await LeaveRequest.findByPk(id)
  if (!item || item.studentId !== studentId) return res.status(404).json({ error: 'Not found' })
  if (item.status !== 'pending') return res.status(400).json({ error: 'Cannot delete processed request' })
  await item.destroy()
  return res.json({ ok: true })
})

// Staff/Admin: fetch all leave requests with student details
leavesRouter.get('/all', verifyFirebaseToken, async (req, res) => {
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

    const items = await LeaveRequest.findAll({ order: [['createdAt', 'DESC']] })

    // Attach student info for each leave request
    const studentIds = Array.from(new Set(items.map((l: any) => l.studentId)))
    const students = await User.findAll({ where: { id: studentIds } as any })
    const byId: Record<string, any> = {}
    for (const s of students) byId[s.id] = s

    const rows = items.map((l: any) => ({
      id: l.id,
      studentId: l.studentId,
      fromDate: l.fromDate,
      toDate: l.toDate,
      session: l.session,
      type: l.type,
      reason: l.reason,
      halfday: l.halfday,
      hourly: l.hourly,
      status: l.status,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
      student: byId[l.studentId]
        ? {
            id: byId[l.studentId].id,
            name: byId[l.studentId].name,
            email: byId[l.studentId].email
          }
        : null
    }))

    return res.json({ items: rows })
  } catch (err: any) {
    console.error('Error fetching all leave requests:', err)
    return res.status(500).json({ error: err?.message || 'Failed to fetch leave requests' })
  }
})

// Staff/Admin: update leave request status (approve/reject)
leavesRouter.put('/:id/status', verifyFirebaseToken, async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body as { status: 'pending' | 'approved' | 'rejected' }
    const uid = (req as any).uid as string
    const email = (req as any).email as string | undefined

    if (!status || (status !== 'pending' && status !== 'approved' && status !== 'rejected')) {
      return res.status(400).json({ error: 'Invalid status. Must be "pending", "approved", or "rejected"' })
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

    const item = await LeaveRequest.findByPk(id)
    if (!item) return res.status(404).json({ error: 'Leave request not found' })

    item.status = status
    await item.save()

    return res.json({ ok: true, item })
  } catch (err: any) {
    console.error('Error updating leave request status:', err)
    return res.status(500).json({ error: err?.message || 'Failed to update leave request status' })
  }
})


