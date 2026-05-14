import { Router } from 'express'
import { randomUUID } from 'crypto'
import { Op } from 'sequelize'
import { verifyFirebaseToken } from '../services/firebaseAdmin.js'
import { InternalMark } from '../models/InternalMark.js'
import { Subject } from '../models/Subject.js'
import { User } from '../models/User.js'

export const internalMarksRouter = Router()

const toRollEmail = (roll?: string | null) => {
  if (!roll) return null
  const match = roll.match(/(\d{3})$/)
  if (!match) return null
  const serial = match[1].replace(/^0+/, '')
  const padded = serial.padStart(3, '0')
  return `student${padded}@college.edu`
}

const toRollNumber = (email?: string | null) => {
  if (!email) return null
  const prefix = email.split('@')[0]
  const match = prefix.match(/student(\d+)/i)
  if (!match) return null
  return `21BCS${match[1].padStart(3, '0')}`
}

const resolveUser = async (uid: string, email?: string | null) => {
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

const ensureRole = async (uid: string, email: string | undefined, allowed: Array<'student' | 'staff' | 'admin'>) => {
  const user = await resolveUser(uid, email)
  if (!user || !allowed.includes(user.role)) {
    return null
  }
  return user
}

const resolveStudent = async (identifier?: string | null) => {
  if (!identifier) return null
  if (identifier.includes('@')) {
    return User.findOne({ where: { email: identifier } })
  }
  const possibleById = await User.findByPk(identifier)
  if (possibleById) return possibleById

  const emailFromRoll = toRollEmail(identifier)
  if (emailFromRoll) {
    return User.findOne({ where: { email: emailFromRoll } })
  }

  return User.findOne({ where: { email: identifier } })
}

const resolveSubject = async (identifier: string) => {
  if (!identifier) return null
  if (identifier.includes('-') && identifier.length > 20) {
    const byId = await Subject.findByPk(identifier)
    if (byId) return byId
  }
  const code = identifier.replace('SUBJ-', '')
  return Subject.findOne({ where: { code } })
}

const attachRelations = async (marks: InternalMark[]) => {
  const subjectIds = Array.from(new Set(marks.map((m) => m.subjectId)))
  const studentIds = Array.from(new Set(marks.map((m) => m.studentId)))
  const staffIds = Array.from(new Set(marks.map((m) => m.createdBy)))

  const [subjects, students, staff] = await Promise.all([
    Subject.findAll({ where: { id: { [Op.in]: subjectIds } } as any }),
    User.findAll({ where: { id: { [Op.in]: studentIds } } as any }),
    User.findAll({ where: { id: { [Op.in]: staffIds } } as any })
  ])

  const subjectMap = new Map(subjects.map((s: any) => [s.id, s]))
  const studentMap = new Map(students.map((s: any) => [s.id, s]))
  const staffMap = new Map(staff.map((s: any) => [s.id, s]))

  return marks.map((mark) => {
    const subject = subjectMap.get(mark.subjectId)
    const student = studentMap.get(mark.studentId)
    const recorder = staffMap.get(mark.createdBy)
    return {
      ...mark.toJSON(),
      subject: subject ? {
        id: subject.id,
        code: subject.code,
        name: subject.name,
        section: subject.section
      } : null,
      student: student ? {
        id: student.id,
        name: student.name,
        email: student.email,
        rollNumber: toRollNumber(student.email)
      } : null,
      recordedBy: recorder ? {
        id: recorder.id,
        name: recorder.name,
        email: recorder.email
      } : null
    }
  })
}

internalMarksRouter.get('/mine', verifyFirebaseToken, async (req, res) => {
  try {
    const uid = (req as any).uid as string
    const email = (req as any).email as string | undefined
    const user = await ensureRole(uid, email, ['student'])
    if (!user) {
      return res.status(403).json({ error: 'Only students can access their internal marks.' })
    }

    const marks = await InternalMark.findAll({
      where: { studentId: user.id },
      order: [['recordedAt', 'DESC'], ['createdAt', 'DESC']]
    })

    const enriched = await attachRelations(marks)
    return res.json({ marks: enriched })
  } catch (error: any) {
    console.error('Error fetching student internal marks:', error)
    return res.status(500).json({ error: error?.message || 'Failed to fetch internal marks' })
  }
})

internalMarksRouter.get('/', verifyFirebaseToken, async (req, res) => {
  try {
    const uid = (req as any).uid as string
    const email = (req as any).email as string | undefined
    const user = await ensureRole(uid, email, ['staff', 'admin'])
    if (!user) {
      return res.status(403).json({ error: 'Unauthorized. Staff or admin access required.' })
    }

    const { subjectId, studentId, rollNo } = req.query as Record<string, string | undefined>
    const where: any = {}

    if (studentId || rollNo) {
      const student = await resolveStudent(studentId || rollNo)
      if (!student) {
        return res.json({ marks: [] })
      }
      where.studentId = student.id
    }

    if (subjectId) {
      const subject = await resolveSubject(subjectId)
      if (!subject) {
        return res.json({ marks: [] })
      }
      where.subjectId = subject.id
    }

    const marks = await InternalMark.findAll({
      where,
      order: [['recordedAt', 'DESC'], ['createdAt', 'DESC']]
    })

    const enriched = await attachRelations(marks)
    return res.json({ marks: enriched })
  } catch (error: any) {
    console.error('Error fetching internal marks:', error)
    return res.status(500).json({ error: error?.message || 'Failed to fetch internal marks' })
  }
})

internalMarksRouter.get('/student/:identifier', verifyFirebaseToken, async (req, res) => {
  try {
    const { identifier } = req.params
    const uid = (req as any).uid as string
    const email = (req as any).email as string | undefined
    const user = await resolveUser(uid, email)
    if (!user) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    const student = await resolveStudent(identifier)
    if (!student) {
      return res.status(404).json({ error: 'Student not found' })
    }

    if (user.role === 'student' && user.id !== student.id) {
      return res.status(403).json({ error: 'Students can only view their own marks' })
    }

    if (user.role === 'student') {
      // Already verified; fall through
    } else if (user.role !== 'staff' && user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    const marks = await InternalMark.findAll({
      where: { studentId: student.id },
      order: [['recordedAt', 'DESC'], ['createdAt', 'DESC']]
    })

    const enriched = await attachRelations(marks)
    return res.json({ marks: enriched, student: {
      id: student.id,
      name: student.name,
      email: student.email,
      rollNumber: toRollNumber(student.email)
    } })
  } catch (error: any) {
    console.error('Error fetching student internal marks by identifier:', error)
    return res.status(500).json({ error: error?.message || 'Failed to fetch internal marks' })
  }
})

internalMarksRouter.post('/', verifyFirebaseToken, async (req, res) => {
  try {
    const uid = (req as any).uid as string
    const email = (req as any).email as string | undefined
    const user = await ensureRole(uid, email, ['staff', 'admin'])
    if (!user) {
      return res.status(403).json({ error: 'Unauthorized. Staff or admin access required.' })
    }

    const { subjectId, subjectCode, studentId, rollNumber, assessmentName, maxMark, obtainedMark, recordedAt, remarks } = req.body as {
      subjectId?: string
      subjectCode?: string
      studentId?: string
      rollNumber?: string
      assessmentName?: string
      maxMark?: number
      obtainedMark?: number
      recordedAt?: string
      remarks?: string
    }

    if (!assessmentName) {
      return res.status(400).json({ error: 'Assessment name is required' })
    }

    if (typeof maxMark !== 'number' || typeof obtainedMark !== 'number') {
      return res.status(400).json({ error: 'Max and obtained marks must be numbers' })
    }

    if (obtainedMark < 0 || maxMark <= 0 || obtainedMark > maxMark) {
      return res.status(400).json({ error: 'Invalid marks range' })
    }

    const student = await resolveStudent(studentId || rollNumber)
    if (!student || student.role !== 'student') {
      return res.status(400).json({ error: 'Student not found' })
    }

    const subjectIdentifier = subjectId || subjectCode
    if (!subjectIdentifier) {
      return res.status(400).json({ error: 'Subject identifier is required' })
    }
    const subject = await resolveSubject(subjectIdentifier)
    if (!subject) {
      return res.status(400).json({ error: 'Subject not found' })
    }

    const dateValue = recordedAt ? new Date(recordedAt) : new Date()
    if (Number.isNaN(dateValue.getTime())) {
      return res.status(400).json({ error: 'Invalid recordedAt date' })
    }

    const mark = await InternalMark.create({
      id: randomUUID(),
      studentId: student.id,
      subjectId: subject.id,
      assessmentName,
      maxMark,
      obtainedMark,
      recordedAt: dateValue.toISOString().split('T')[0],
      createdBy: user.id,
      remarks: remarks || null
    })

    const [enriched] = await attachRelations([mark])
    return res.status(201).json({ ok: true, mark: enriched })
  } catch (error: any) {
    console.error('Error creating internal mark:', error)
    return res.status(500).json({ error: error?.message || 'Failed to create internal mark' })
  }
})

internalMarksRouter.put('/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const { id } = req.params
    const uid = (req as any).uid as string
    const email = (req as any).email as string | undefined
    const user = await ensureRole(uid, email, ['staff', 'admin'])
    if (!user) {
      return res.status(403).json({ error: 'Unauthorized. Staff or admin access required.' })
    }

    const mark = await InternalMark.findByPk(id)
    if (!mark) {
      return res.status(404).json({ error: 'Internal mark not found' })
    }

    const { assessmentName, maxMark, obtainedMark, recordedAt, remarks } = req.body as {
      assessmentName?: string
      maxMark?: number
      obtainedMark?: number
      recordedAt?: string
      remarks?: string
    }

    const update: any = {}
    if (assessmentName) update.assessmentName = assessmentName
    if (typeof maxMark === 'number') update.maxMark = maxMark
    if (typeof obtainedMark === 'number') update.obtainedMark = obtainedMark
    if (recordedAt) {
      const dateValue = new Date(recordedAt)
      if (Number.isNaN(dateValue.getTime())) {
        return res.status(400).json({ error: 'Invalid recordedAt date' })
      }
      update.recordedAt = dateValue.toISOString().split('T')[0]
    }
    if (typeof remarks !== 'undefined') update.remarks = remarks || null

    if (typeof update.maxMark === 'number' && typeof update.obtainedMark === 'number') {
      if (update.maxMark <= 0 || update.obtainedMark < 0 || update.obtainedMark > update.maxMark) {
        return res.status(400).json({ error: 'Invalid marks range' })
      }
    }

    await mark.update(update)
    const [enriched] = await attachRelations([mark])
    return res.json({ ok: true, mark: enriched })
  } catch (error: any) {
    console.error('Error updating internal mark:', error)
    return res.status(500).json({ error: error?.message || 'Failed to update internal mark' })
  }
})

internalMarksRouter.delete('/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const { id } = req.params
    const uid = (req as any).uid as string
    const email = (req as any).email as string | undefined
    const user = await ensureRole(uid, email, ['staff', 'admin'])
    if (!user) {
      return res.status(403).json({ error: 'Unauthorized. Staff or admin access required.' })
    }

    const mark = await InternalMark.findByPk(id)
    if (!mark) {
      return res.status(404).json({ error: 'Internal mark not found' })
    }

    await mark.destroy()
    return res.json({ ok: true })
  } catch (error: any) {
    console.error('Error deleting internal mark:', error)
    return res.status(500).json({ error: error?.message || 'Failed to delete internal mark' })
  }
})


