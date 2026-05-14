import { Router } from 'express'
import { randomUUID } from 'crypto'
import { verifyFirebaseToken } from '../services/firebaseAdmin.js'
import { AssignmentSubmission } from '../models/AssignmentSubmission.js'
import { Assignment } from '../models/Assignment.js'
import { User } from '../models/User.js'
import { Subject } from '../models/Subject.js'

export const assignmentsRouter = Router()

const resolveStudentId = async (uid: string, email?: string) => {
  if (email) {
    const u = await User.findOne({ where: { email } })
    if (u) return u.id
  }
  return uid
}

const ensureRole = async (uid: string, email: string | undefined, allowed: Array<'student' | 'staff' | 'admin'>) => {
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
    if (!allowed.includes(user.role)) return null
    return user
  }
  const user = await User.findByPk(uid)
  if (!user || !allowed.includes(user.role)) return null
  return user
}

// Get student's submissions (for viewing their own submissions)
assignmentsRouter.get('/submissions', verifyFirebaseToken, async (req, res) => {
  try {
    const uid = (req as any).uid as string
    const email = (req as any).email as string | undefined
    const studentId = await resolveStudentId(uid, email)
    
    const items = await AssignmentSubmission.findAll({ where: { studentId }, order: [['createdAt', 'DESC']] })
    
    // Get assignment details to include due dates
    const { Subject } = await import('../models/Subject.js')
    const assignments = await Assignment.findAll({})
    const assignmentsByCodeAndName = new Map()
    assignments.forEach((a: any) => {
      const key = `${a.subjectCode}-${a.assignmentName}`
      assignmentsByCodeAndName.set(key, a)
    })
    
    const itemsWithDueDate = items.map((item: any) => {
      const key = `${item.subjectCode}-${item.assignmentName}`
      const assignment = assignmentsByCodeAndName.get(key)
      return {
        ...item.toJSON(),
        dueDate: assignment?.dueDate || null
      }
    })
    
    return res.json({ items: itemsWithDueDate })
  } catch (error: any) {
    console.error('Error fetching student submissions:', error)
    return res.status(500).json({ error: error.message || 'Failed to fetch submissions' })
  }
})

// Get assignments for student (all assignments for subjects they're enrolled in)
assignmentsRouter.get('/', verifyFirebaseToken, async (req, res) => {
  try {
    const uid = (req as any).uid as string
    const email = (req as any).email as string | undefined
    const studentId = await resolveStudentId(uid, email)

    // Get all subjects the student is enrolled in
    const { Enrollment } = await import('../models/Enrollment.js')
    const { Subject } = await import('../models/Subject.js')
    
    const enrollments = await Enrollment.findAll({ where: { studentId } })
    const subjectIds = enrollments.map((e: any) => e.subjectId)
    
    if (subjectIds.length === 0) {
      return res.json({ assignments: [] })
    }

    // Get all assignments for these subjects
    const assignments = await Assignment.findAll({
      where: { subjectId: subjectIds } as any,
      order: [['createdAt', 'DESC']]
    })

    // Get subject details for each assignment
    const subjects = await Subject.findAll({ where: { id: subjectIds } as any })
    const subjectsById = new Map()
    subjects.forEach((s: any) => subjectsById.set(s.id, s))

    // Get staff details for each assignment
    const staffIds = Array.from(new Set(assignments.map((a: any) => a.createdBy)))
    const staff = await User.findAll({ where: { id: staffIds } as any })
    const staffById = new Map()
    staff.forEach((s: any) => staffById.set(s.id, s))

    const assignmentsWithDetails = assignments.map((a: any) => {
      const subject = subjectsById.get(a.subjectId)
      const staffMember = staffById.get(a.createdBy)
      return {
        ...a.toJSON(),
        subject: subject ? {
          code: subject.code,
          name: subject.name,
          section: subject.section
        } : null,
        staffName: staffMember?.name || 'Unknown Staff'
      }
    })

    return res.json({ assignments: assignmentsWithDetails })
  } catch (error: any) {
    console.error('Error fetching student assignments:', error)
    return res.status(500).json({ error: error.message || 'Failed to fetch assignments' })
  }
})

assignmentsRouter.post('/', verifyFirebaseToken, async (req, res) => {
  const uid = (req as any).uid as string
  const email = (req as any).email as string | undefined
  const studentId = await resolveStudentId(uid, email)
  const { subjectCode, subjectName, assignmentName, staffName, attachmentUrl } = req.body as any
  if (!subjectCode || !assignmentName || !attachmentUrl) return res.status(400).json({ error: 'Missing fields' })
  const item = await AssignmentSubmission.create({ id: randomUUID(), studentId, subjectCode, subjectName: subjectName || '', assignmentName, staffName: staffName || '', attachmentUrl, submittedAt: new Date() })
  return res.json({ ok: true, item })
})

assignmentsRouter.delete('/:id', verifyFirebaseToken, async (req, res) => {
  const { id } = req.params
  const uid = (req as any).uid as string
  const email = (req as any).email as string | undefined
  const studentId = await resolveStudentId(uid, email)
  const item = await AssignmentSubmission.findByPk(id)
  if (!item || item.studentId !== studentId) return res.status(404).json({ error: 'Not found' })
  await item.destroy()
  return res.json({ ok: true })
})

// ========== STAFF ROUTES ==========

// Create assignment (staff only)
assignmentsRouter.post('/create', verifyFirebaseToken, async (req, res) => {
  try {
    const uid = (req as any).uid as string
    const email = (req as any).email as string | undefined

    // Verify user is staff/admin
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
      return res.status(403).json({ error: 'Unauthorized. Only staff/admin can create assignments.' })
    }

    const { subjectId, subjectCode, subjectName, assignmentName, description, dueDate, minMark, maxMark } = req.body as {
      subjectId: string
      subjectCode: string
      subjectName: string
      assignmentName: string
      description?: string
      dueDate: string
      minMark?: number
      maxMark?: number
    }

    if (!subjectId || !subjectCode || !assignmentName || !dueDate) {
      return res.status(400).json({ error: 'Missing required fields: subjectId, subjectCode, assignmentName, dueDate' })
    }

    const assignment = await Assignment.create({
      id: randomUUID(),
      subjectId,
      subjectCode,
      subjectName: subjectName || '',
      assignmentName,
      description: description || null,
      dueDate,
      minMark: minMark || 0,
      maxMark: maxMark || 100,
      createdBy: user.id
    })

    return res.json({ ok: true, assignment })
  } catch (error: any) {
    console.error('Error creating assignment:', error)
    return res.status(500).json({ error: error.message || 'Failed to create assignment' })
  }
})

// Get all assignments for a subject (staff only)
assignmentsRouter.get('/subject/:subjectId', verifyFirebaseToken, async (req, res) => {
  try {
    const { subjectId } = req.params
    const uid = (req as any).uid as string
    const email = (req as any).email as string | undefined

    // Verify user is staff/admin
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

    // Resolve subjectId if it's a code
    let actualSubjectId = subjectId
    const { Subject } = await import('../models/Subject.js')
    if (!subjectId.includes('-') || subjectId.startsWith('SUBJ-')) {
      const code = subjectId.replace('SUBJ-', '')
      const subject = await Subject.findOne({ where: { code } })
      if (subject) {
        actualSubjectId = subject.id
      }
    }

    const assignments = await Assignment.findAll({
      where: { subjectId: actualSubjectId },
      order: [['createdAt', 'DESC']]
    })

    return res.json({ assignments })
  } catch (error: any) {
    console.error('Error fetching assignments:', error)
    return res.status(500).json({ error: error.message || 'Failed to fetch assignments' })
  }
})

// Get all submissions for an assignment (staff only)
assignmentsRouter.get('/:assignmentId/submissions', verifyFirebaseToken, async (req, res) => {
  try {
    const { assignmentId } = req.params
    const uid = (req as any).uid as string
    const email = (req as any).email as string | undefined

    // Verify user is staff/admin
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

    const assignment = await Assignment.findByPk(assignmentId)
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' })
    }

    // Get all submissions for this assignment (match by assignmentName and subjectCode)
    const submissions = await AssignmentSubmission.findAll({
      where: {
        assignmentName: assignment.assignmentName,
        subjectCode: assignment.subjectCode
      },
      order: [['submittedAt', 'DESC']]
    })

    // Get student details
    const studentIds = Array.from(new Set(submissions.map((s: any) => s.studentId)))
    const students = await User.findAll({ where: { id: studentIds } as any })
    const studentsById = new Map()
    students.forEach((s: any) => studentsById.set(s.id, s))

    const submissionsWithStudents = submissions.map((sub: any) => {
      const student = studentsById.get(sub.studentId)
      return {
        ...sub.toJSON(),
        student: student ? {
          id: student.id,
          name: student.name,
          email: student.email
        } : null
      }
    })

    return res.json({ assignment, submissions: submissionsWithStudents })
  } catch (error: any) {
    console.error('Error fetching assignment submissions:', error)
    return res.status(500).json({ error: error.message || 'Failed to fetch submissions' })
  }
})

// Get all submissions for a subject (staff only) - grouped by assignment
assignmentsRouter.get('/subject/:subjectId/submissions', verifyFirebaseToken, async (req, res) => {
  try {
    const { subjectId } = req.params
    const uid = (req as any).uid as string
    const email = (req as any).email as string | undefined

    // Verify user is staff/admin
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

    // Resolve subjectId if it's a code
    let actualSubjectId = subjectId
    const { Subject } = await import('../models/Subject.js')
    if (!subjectId.includes('-') || subjectId.startsWith('SUBJ-')) {
      const code = subjectId.replace('SUBJ-', '')
      const subject = await Subject.findOne({ where: { code } })
      if (subject) {
        actualSubjectId = subject.id
      }
    }

    // Get subject to get code
    const subject = await Subject.findByPk(actualSubjectId)
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' })
    }

    // Get all submissions for this subject
    const submissions = await AssignmentSubmission.findAll({
      where: { subjectCode: subject.code },
      order: [['submittedAt', 'DESC']]
    })

    // Get student details
    const studentIds = Array.from(new Set(submissions.map((s: any) => s.studentId)))
    const students = await User.findAll({ where: { id: studentIds } as any })
    const studentsById = new Map()
    students.forEach((s: any) => studentsById.set(s.id, s))

    const submissionsWithStudents = submissions.map((sub: any) => {
      const student = studentsById.get(sub.studentId)
      return {
        ...sub.toJSON(),
        student: student ? {
          id: student.id,
          name: student.name,
          email: student.email
        } : null
      }
    })

    return res.json({ submissions: submissionsWithStudents })
  } catch (error: any) {
    console.error('Error fetching subject submissions:', error)
    return res.status(500).json({ error: error.message || 'Failed to fetch submissions' })
  }
})

// Mark/grade a submission (staff only)
assignmentsRouter.put('/submissions/:id/mark', verifyFirebaseToken, async (req, res) => {
  try {
    const { id } = req.params
    const { obtainedMark, minMark, maxMark, remarks } = req.body as {
      obtainedMark?: number
      minMark?: number
      maxMark?: number
      remarks?: string
    }
    const uid = (req as any).uid as string
    const email = (req as any).email as string | undefined

    // Verify user is staff/admin
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
      return res.status(403).json({ error: 'Unauthorized. Only staff/admin can grade assignments.' })
    }

    const submission = await AssignmentSubmission.findByPk(id)
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' })
    }

    const updateData: any = {}
    if (obtainedMark !== undefined) updateData.obtainedMark = obtainedMark
    if (minMark !== undefined) updateData.minMark = minMark
    if (maxMark !== undefined) updateData.maxMark = maxMark
    if (remarks !== undefined) updateData.remarks = remarks
    if (obtainedMark !== undefined || remarks !== undefined) {
      updateData.gradedAt = new Date()
      updateData.gradedBy = user.id
    }

    await submission.update(updateData)

    return res.json({ ok: true, submission })
  } catch (error: any) {
    console.error('Error marking submission:', error)
    return res.status(500).json({ error: error.message || 'Failed to mark submission' })
  }
})

assignmentsRouter.get('/all', verifyFirebaseToken, async (req, res) => {
  try {
    const uid = (req as any).uid as string
    const email = (req as any).email as string | undefined
    const admin = await ensureRole(uid, email, ['admin'])
    if (!admin) {
      return res.status(403).json({ error: 'Unauthorized. Admin access required.' })
    }

    const assignments = await Assignment.findAll({ order: [['createdAt', 'DESC']] })
    const subjectIds = Array.from(new Set(assignments.map((a: any) => a.subjectId)))
    const staffIds = Array.from(new Set(assignments.map((a: any) => a.createdBy)))

    const [subjects, staff] = await Promise.all([
      Subject.findAll({ where: { id: subjectIds } as any }),
      User.findAll({ where: { id: staffIds } as any })
    ])

    const subjectMap = new Map(subjects.map((s: any) => [s.id, s]))
    const staffMap = new Map(staff.map((s: any) => [s.id, s]))

    const enriched = assignments.map((assignment) => {
      const subject = subjectMap.get(assignment.subjectId)
      const creator = staffMap.get(assignment.createdBy)
      return {
        ...assignment.toJSON(),
        subject: subject ? { id: subject.id, code: subject.code, name: subject.name, section: subject.section } : null,
        createdByUser: creator ? { id: creator.id, name: creator.name, email: creator.email } : null
      }
    })

    return res.json({ assignments: enriched })
  } catch (error: any) {
    console.error('Error fetching all assignments:', error)
    return res.status(500).json({ error: error?.message || 'Failed to fetch assignments' })
  }
})


