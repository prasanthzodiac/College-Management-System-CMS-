import { Router } from 'express'
import { randomUUID } from 'crypto'
import { verifyFirebaseToken } from '../services/firebaseAdmin.js'
import { Event } from '../models/Event.js'

export const eventsRouter = Router()

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

eventsRouter.get('/', verifyFirebaseToken, async (_req, res) => {
  const events = await Event.findAll({ order: [['startDate', 'ASC'], ['title', 'ASC']] })
  return res.json({ events })
})

eventsRouter.post('/', verifyFirebaseToken, async (req, res) => {
  const uid = (req as any).uid as string
  const email = (req as any).email as string | undefined
  const user = await ensureStaffOrAdmin(uid, email)
  if (!user) {
    return res.status(403).json({ error: 'Unauthorized. Staff or admin access required.' })
  }

  const { title, description, department, venue, startDate, endDate, contactName, contactEmail, contactPhone, status, attachmentUrl } = req.body as any

  if (!title || !startDate || !endDate) {
    return res.status(400).json({ error: 'title, startDate and endDate are required' })
  }

  const event = await Event.create({
    id: randomUUID(),
    title,
    description: description ?? null,
    department: department ?? null,
    venue: venue ?? null,
    startDate,
    endDate,
    contactName: contactName ?? null,
    contactEmail: contactEmail ?? null,
    contactPhone: contactPhone ?? null,
    status: status ?? null,
    attachmentUrl: attachmentUrl ?? null,
    createdBy: user.id
  })

  return res.json({ ok: true, event })
})

eventsRouter.put('/:id', verifyFirebaseToken, async (req, res) => {
  const uid = (req as any).uid as string
  const email = (req as any).email as string | undefined
  const user = await ensureStaffOrAdmin(uid, email)
  if (!user) {
    return res.status(403).json({ error: 'Unauthorized. Staff or admin access required.' })
  }

  const { id } = req.params
  const event = await Event.findByPk(id)
  if (!event) {
    return res.status(404).json({ error: 'Event not found' })
  }

  const { title, description, department, venue, startDate, endDate, contactName, contactEmail, contactPhone, status, attachmentUrl } = req.body as any

  await event.update({
    title: title ?? event.title,
    description: description ?? event.description,
    department: department ?? event.department,
    venue: venue ?? event.venue,
    startDate: startDate ?? event.startDate,
    endDate: endDate ?? event.endDate,
    contactName: contactName ?? event.contactName,
    contactEmail: contactEmail ?? event.contactEmail,
    contactPhone: contactPhone ?? event.contactPhone,
    status: status ?? event.status,
    attachmentUrl: attachmentUrl ?? event.attachmentUrl
  })

  return res.json({ ok: true, event })
})

eventsRouter.delete('/:id', verifyFirebaseToken, async (req, res) => {
  const uid = (req as any).uid as string
  const email = (req as any).email as string | undefined
  const user = await ensureStaffOrAdmin(uid, email)
  if (!user) {
    return res.status(403).json({ error: 'Unauthorized. Staff or admin access required.' })
  }

  const { id } = req.params
  const event = await Event.findByPk(id)
  if (!event) {
    return res.status(404).json({ error: 'Event not found' })
  }

  await event.destroy()
  return res.json({ ok: true })
})


