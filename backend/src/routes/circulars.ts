import { Router } from 'express'
import { randomUUID } from 'crypto'
import { verifyFirebaseToken } from '../services/firebaseAdmin.js'
import { Circular } from '../models/Circular.js'

export const circularsRouter = Router()

const ensureStaffOrAdmin = async (uid: string, email?: string) => {
  const { User } = await import('../models/User.js')
  let user: any = null
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
    return null
  }
  return user
}

circularsRouter.get('/', verifyFirebaseToken, async (_req, res) => {
  const circulars = await Circular.findAll({ order: [['issuedDate', 'DESC'], ['title', 'ASC']] })
  return res.json({ circulars })
})

circularsRouter.post('/', verifyFirebaseToken, async (req, res) => {
  const uid = (req as any).uid as string
  const email = (req as any).email as string | undefined
  const user = await ensureStaffOrAdmin(uid, email)
  if (!user) {
    return res.status(403).json({ error: 'Unauthorized. Staff or admin access required.' })
  }

  const { circularNo, title, description, department, issuedDate, attachmentUrl } = req.body as any
  if (!title || !issuedDate) {
    return res.status(400).json({ error: 'title and issuedDate are required' })
  }

  const circular = await Circular.create({
    id: randomUUID(),
    circularNo: circularNo ?? null,
    title,
    description: description ?? null,
    department: department ?? null,
    issuedDate,
    attachmentUrl: attachmentUrl ?? null,
    createdBy: user.id
  })

  return res.json({ ok: true, circular })
})

circularsRouter.put('/:id', verifyFirebaseToken, async (req, res) => {
  const uid = (req as any).uid as string
  const email = (req as any).email as string | undefined
  const user = await ensureStaffOrAdmin(uid, email)
  if (!user) {
    return res.status(403).json({ error: 'Unauthorized. Staff or admin access required.' })
  }

  const { id } = req.params
  const circular = await Circular.findByPk(id)
  if (!circular) {
    return res.status(404).json({ error: 'Circular not found' })
  }

  const { circularNo, title, description, department, issuedDate, attachmentUrl } = req.body as any
  await circular.update({
    circularNo: circularNo ?? circular.circularNo,
    title: title ?? circular.title,
    description: description ?? circular.description,
    department: department ?? circular.department,
    issuedDate: issuedDate ?? circular.issuedDate,
    attachmentUrl: attachmentUrl ?? circular.attachmentUrl
  })

  return res.json({ ok: true, circular })
})

circularsRouter.delete('/:id', verifyFirebaseToken, async (req, res) => {
  const uid = (req as any).uid as string
  const email = (req as any).email as string | undefined
  const user = await ensureStaffOrAdmin(uid, email)
  if (!user) {
    return res.status(403).json({ error: 'Unauthorized. Staff or admin access required.' })
  }

  const { id } = req.params
  const circular = await Circular.findByPk(id)
  if (!circular) {
    return res.status(404).json({ error: 'Circular not found' })
  }

  await circular.destroy()
  return res.json({ ok: true })
})


