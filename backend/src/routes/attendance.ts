import { Router } from 'express'
import { randomUUID } from 'crypto'
import { Op } from 'sequelize'
import { verifyFirebaseToken } from '../services/firebaseAdmin.js'
import { AttendanceEntry, AttendanceSession } from '../models/Attendance.js'
import { io } from '../server.js'

export const attendanceRouter = Router()

const PERIOD_ORDER = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const deriveRollNumber = (email?: string | null) => {
    if (!email) return null
    const prefix = email.split('@')[0]
    const match = prefix.match(/student(\d+)/i)
    if (!match) return null
    const num = match[1].padStart(3, '0')
    // Default demo pattern aligns with seed data (21BCS###)
    return `21BCS${num}`
}

const rollToEmail = (roll?: string | null) => {
    if (!roll) return null
    const match = roll.match(/(\d{3})$/)
    if (!match) return null
    const serial = match[1].replace(/^0+/, '')
    const padded = serial.padStart(3, '0')
    return `student${padded}@college.edu`
}

const ensureStaffOrAdmin = async (uid: string, email?: string | undefined) => {
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
    if (!user) {
        user = await User.findByPk(uid)
    }
    if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
        return null
    }
    return user
}

const ensureAdmin = async (uid: string, email?: string | undefined) => {
    const user = await ensureStaffOrAdmin(uid, email)
    if (!user || user.role !== 'admin') return null
    return user
}

const getDayName = (dateStr: string) => {
    const dateObj = new Date(`${dateStr}T00:00:00`)
    return DAY_NAMES[dateObj.getDay()] || ''
}

// Admin/Staff: Generate current week's (Mon-Sat) timetable sessions and attendance entries for all students
attendanceRouter.post('/generate-week', verifyFirebaseToken, async (req, res) => {
    try {
        const uid = (req as any).uid as string
        const email = (req as any).email as string | undefined
        const user = await ensureStaffOrAdmin(uid, email)
        if (!user) {
            return res.status(403).json({ error: 'Unauthorized. Staff or admin access required.' })
        }

        const { Subject } = await import('../models/Subject.js')
        const { StaffSubject } = await import('../models/StaffSubject.js')
        const { User } = await import('../models/User.js')

        // Ensure special subjects exist
        const ensureSubject = async (code: string, name: string, section: string) => {
            let subject = await Subject.findOne({ where: { code } })
            if (!subject) {
                const { randomUUID } = await import('crypto')
                subject = await Subject.create({ id: randomUUID(), code, name, section })
            }
            return subject
        }

        const free = await ensureSubject('FREE001', 'Free Period', 'ALL')
        const lib = await ensureSubject('LIB001', 'Library Period', 'ALL')
        const onl = await ensureSubject('ONL001', 'Online Course Period', 'ALL')

        // Collect staff subjects (excluding specials)
        const staffSubjects = await StaffSubject.findAll()
        const subjectIds = staffSubjects.map((s: any) => s.subjectId)
        const subjects = await Subject.findAll({ where: { id: subjectIds } as any })
        const regularSubjects = subjects.filter((s: any) => !['FREE001', 'LIB001', 'ONL001'].includes(s.code))

        // If no regular subjects assigned, fall back to all subjects except special ones
        if (!regularSubjects.length) {
            const allSubjects = await Subject.findAll()
            regularSubjects.push(
                ...allSubjects.filter((s: any) => !['FREE001', 'LIB001', 'ONL001'].includes(s.code))
            )
        }

        // Ensure staff assignments so timetable reflects the generated sessions
        const staffUsers = await User.findAll({ where: { role: 'staff' } })
        const sharedSubjects = [free, lib, onl]
        for (const staffUser of staffUsers as any[]) {
            for (const subject of sharedSubjects) {
                const existing = await StaffSubject.findOne({ where: { staffId: staffUser.id, subjectId: subject.id } })
                if (!existing) {
                    const { randomUUID } = await import('crypto')
                    await StaffSubject.create({ id: randomUUID(), staffId: staffUser.id, subjectId: subject.id })
                }
            }
        }

        // Get all students
        const students = await User.findAll({ where: { role: 'student' } })

        // Determine week Mon-Sat
        const today = new Date()
        const day = today.getDay()
        const mondayOffset = day === 0 ? -6 : 1 - day
        const monday = new Date(today)
        monday.setDate(today.getDate() + mondayOffset)
        monday.setHours(0, 0, 0, 0)

        const toLocalISO = (date: Date) => {
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const dayNum = String(date.getDate()).padStart(2, '0')
            return `${year}-${month}-${dayNum}`
        }

        const days: string[] = []
        for (let i = 0; i < 6; i++) {
            const d = new Date(monday)
            d.setDate(monday.getDate() + i)
            days.push(toLocalISO(d))
        }

        const weekStart = days[0]
        const weekEnd = days[days.length - 1]
        const cleanupStartDate = (() => {
            const d = new Date(monday)
            d.setDate(monday.getDate() - 2) // include weekend before Monday
            return toLocalISO(d)
        })()

        const existingWeekSessions = await AttendanceSession.findAll({
            where: { date: { [Op.between]: [cleanupStartDate, weekEnd] } }
        })
        if (existingWeekSessions.length) {
            const sessionIdsToRemove = existingWeekSessions.map((s: any) => s.id)
            await AttendanceEntry.destroy({ where: { sessionId: { [Op.in]: sessionIdsToRemove } } })
            await AttendanceSession.destroy({ where: { id: { [Op.in]: sessionIdsToRemove } } })
        }

        const REGULAR_PERIODS = ['I', 'II', 'III', 'IV', 'V']
        const SPECIAL_PERIODS = ['VI', 'VII', 'VIII']

        // Create/find sessions and populate entries
        let sessionCount = 0
        let entryCount = 0

        for (let i = 0; i < days.length; i++) {
            const dateStr = days[i]
            // Distribute regular subjects across 6*5 = 30 slots
            for (let p = 0; p < REGULAR_PERIODS.length; p++) {
                const period = REGULAR_PERIODS[p]
                const idx = (i * REGULAR_PERIODS.length + p) % Math.max(regularSubjects.length, 1)
                const subject = regularSubjects[idx]
                if (!subject) continue

                // find or create session
                const { randomUUID } = await import('crypto')
                const session = await AttendanceSession.create({ id: randomUUID(), subjectId: subject.id, date: dateStr, period })
                sessionCount++
                for (const s of students as any[]) {
                    const present = Math.random() > 0.15
                    await AttendanceEntry.create({ id: randomUUID(), sessionId: session.id, studentId: s.id, present })
                    entryCount++
                }
            }

            // Specials
                const specials: Array<{ period: string; subjectId: string; present: boolean | 'all' }> = [
                    { period: 'VI', subjectId: free.id, present: true },
                    { period: 'VII', subjectId: lib.id, present: true },
                    { period: 'VIII', subjectId: onl.id, present: true }
            ]
            for (const sp of specials) {
                const { randomUUID } = await import('crypto')
                const session = await AttendanceSession.create({ id: randomUUID(), subjectId: sp.subjectId, date: dateStr, period: sp.period })
                sessionCount++
                for (const s of students as any[]) {
                    const present = sp.present === true ? true : Math.random() > 0.1
                    await AttendanceEntry.create({ id: randomUUID(), sessionId: session.id, studentId: s.id, present })
                    entryCount++
                }
            }
        }

        return res.json({ ok: true, sessions: sessionCount, entries: entryCount, days })
    } catch (error: any) {
        console.error('Error generating week timetable/attendance:', error)
        return res.status(500).json({ error: error?.message || 'Failed to generate week attendance' })
    }
})

// Upsert entries for a session; if sessionId not provided, create a new one
attendanceRouter.post('/session', verifyFirebaseToken, async (req, res) => {
    try {
        const { sessionId, subjectId, date, period, entries } = req.body as {
            sessionId?: string
            subjectId?: string
            date?: string
            period?: string
            entries: Array<{ studentId: string; present: boolean }>
        }

        const uid = (req as any).uid as string
        const email = (req as any).email as string | undefined

        // Verify user is staff/admin
        const { User } = await import('../models/User.js')
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
            return res.status(403).json({ error: 'Unauthorized. Only staff/admin can post attendance.' })
        }

        if (!entries || entries.length === 0) {
            return res.status(400).json({ error: 'No entries provided' })
        }

        // Resolve subjectId if it's a code
        let actualSubjectId = subjectId
        if (subjectId && (!subjectId.includes('-') || subjectId.startsWith('SUBJ-'))) {
            const { Subject } = await import('../models/Subject.js')
            const code = subjectId.replace('SUBJ-', '')
            const subject = await Subject.findOne({ where: { code } })
            if (subject) {
                actualSubjectId = subject.id
            }
        }

        let sid = sessionId
        if (!sid) {
            if (!actualSubjectId || !date || !period) {
                return res.status(400).json({ error: 'Missing subjectId/date/period when sessionId not provided' })
            }
            // Format date as YYYY-MM-DD if needed
            const dateStr = date.includes('T') ? date.split('T')[0] : date
            sid = randomUUID()
            await AttendanceSession.create({ id: sid, subjectId: actualSubjectId, date: dateStr, period })
        } else {
            // If session exists, delete old entries to avoid duplicates
            await AttendanceEntry.destroy({ where: { sessionId: sid } })
        }

        // Create new entries
        for (const e of entries) {
            const id = randomUUID()
            await AttendanceEntry.create({ id, sessionId: sid!, studentId: e.studentId, present: e.present })
            
            // Emit real-time update to the specific student
            if (io) {
                io.to(`student:${e.studentId}`).emit('attendance:updated', {
                    sessionId: sid,
                    studentId: e.studentId,
                    present: e.present,
                    subjectId: actualSubjectId,
                    date,
                    period
                })
            }
        }

        // Also broadcast to all clients watching this subject
        if (io && actualSubjectId) {
            io.to(`subject:${actualSubjectId}`).emit('attendance:session:updated', {
                sessionId: sid,
                subjectId: actualSubjectId,
                date,
                period
            })
        }

        return res.json({ ok: true, sessionId: sid })
    } catch (error: any) {
        console.error('Error posting attendance:', error)
        return res.status(500).json({ error: error.message || 'Failed to post attendance' })
    }
})

attendanceRouter.get('/staff/timetable', verifyFirebaseToken, async (req, res) => {
    try {
        const uid = (req as any).uid as string
        const email = (req as any).email as string | undefined

        const user = await ensureStaffOrAdmin(uid, email)
        if (!user) {
            return res.status(403).json({ error: 'Unauthorized. Staff or admin access required.' })
        }

        const { StaffSubject } = await import('../models/StaffSubject.js')
        const staffSubjects = await StaffSubject.findAll({ where: { staffId: user.id } })
        if (!staffSubjects.length) {
            return res.json({
                staff: { id: user.id, name: user.name, email: user.email },
                periodOrder: PERIOD_ORDER,
                days: [],
                range: null
            })
        }

        const subjectIds = staffSubjects.map((s: any) => s.subjectId)
        const { Subject } = await import('../models/Subject.js')
        const subjects = await Subject.findAll({ where: { id: subjectIds } as any })
        const subjectById = new Map(subjects.map((s: any) => [s.id, s]))

        let startDate = (req.query.startDate as string) || null
        let endDate = (req.query.endDate as string) || null

        // Default to current work week (Mon-Sat) if no date range provided
        if (!startDate || !endDate) {
            const today = new Date()
            const day = today.getDay() // 0 Sun .. 6 Sat
            const mondayOffset = day === 0 ? -6 : 1 - day
            const monday = new Date(today)
            monday.setDate(today.getDate() + mondayOffset)
            monday.setHours(0, 0, 0, 0)
            const saturday = new Date(monday)
            saturday.setDate(monday.getDate() + 5)
            const toLocalISO = (d: Date) => {
                const year = d.getFullYear()
                const month = String(d.getMonth() + 1).padStart(2, '0')
                const dayNum = String(d.getDate()).padStart(2, '0')
                return `${year}-${month}-${dayNum}`
            }
            startDate = startDate || toLocalISO(monday)
            endDate = endDate || toLocalISO(saturday)
        }

        const sessionWhere: any = { subjectId: subjectIds }
        if (startDate && endDate) {
            sessionWhere.date = { [Op.between]: [startDate, endDate] }
        } else if (startDate) {
            sessionWhere.date = { [Op.gte]: startDate }
        } else if (endDate) {
            sessionWhere.date = { [Op.lte]: endDate }
        }

        const sessions = await AttendanceSession.findAll({
            where: sessionWhere,
            order: [['date', 'ASC'], ['period', 'ASC']]
        })

        const dayMap = new Map<string, { date: string; dayName: string; slots: Record<string, any[]> }>()
        for (const session of sessions) {
            const subject = subjectById.get(session.subjectId)
            if (!subject) continue
            const dayKey = session.date
            if (!dayMap.has(dayKey)) {
                dayMap.set(dayKey, {
                    date: session.date,
                    dayName: getDayName(session.date),
                    slots: {}
                })
            }
            const entry = dayMap.get(dayKey)!
            if (!entry.slots[session.period]) entry.slots[session.period] = []
            entry.slots[session.period].push({
                sessionId: session.id,
                period: session.period,
                subjectId: subject.id,
                subjectCode: subject.code,
                subjectName: subject.name,
                section: subject.section
            })
        }

        const days = Array.from(dayMap.values())
            .sort((a, b) => a.date.localeCompare(b.date))
            .filter((day) => Object.keys(day.slots || {}).length > 0)

        let computedRange = null as null | { startDate: string; endDate: string }
        if (days.length) {
            computedRange = {
                startDate: days[0].date,
                endDate: days[days.length - 1].date
            }
        }

        return res.json({
            staff: { id: user.id, name: user.name, email: user.email },
            periodOrder: PERIOD_ORDER,
            days,
            range: computedRange
        })
    } catch (error: any) {
        console.error('Error fetching staff timetable:', error)
        return res.status(500).json({ error: error?.message || 'Failed to load timetable' })
    }
})

// Get student's attendance entries
attendanceRouter.get('/student/:studentId/entries', verifyFirebaseToken, async (req, res) => {
    try {
        const { studentId } = req.params
        const uid = (req as any).uid as string
        const email = (req as any).email as string | undefined

        // Verify student can only see their own entries
        const { User } = await import('../models/User.js')
        
        // In demo mode, try to find user by email first
        let user = null
        if (email) {
            user = await User.findOne({ where: { email } })
        }
        if (!user) {
            user = await User.findByPk(uid)
        }
        if (!user) return res.status(401).json({ error: 'User not found' })
        
        // In demo mode, use the found user's ID if email matches
        let actualStudentId = studentId
        if (user.role === 'student') {
            // If we found the user by email, use their actual ID
            if (email && user.email === email && user.id !== studentId) {
                actualStudentId = user.id
            } else {
                // Verify the requested student exists and the user has permission
                const requestedStudent = await User.findByPk(studentId)
                if (!requestedStudent) {
                    return res.status(404).json({ error: 'Student not found' })
                }
                // Allow if requesting own data or if email matches in demo mode
                if (uid !== studentId && user.id !== studentId && (!email || requestedStudent.email !== email)) {
                    return res.status(403).json({ error: 'Unauthorized' })
                }
            }
        }

        const entries = await AttendanceEntry.findAll({
            where: { studentId: actualStudentId },
            order: [['createdAt', 'DESC']]
        })

        // Get subject details for each entry
        const { Subject } = await import('../models/Subject.js')
        const entriesWithSubjects = await Promise.all(
            entries.map(async (entry: any) => {
                const session = await AttendanceSession.findByPk(entry.sessionId)
                if (!session) return null
                
                const subject = await Subject.findByPk(session.subjectId)
                return {
                    id: entry.id,
                    sessionId: entry.sessionId,
                    studentId: entry.studentId,
                    present: entry.present,
                    date: session.date,
                    period: session.period,
                    subject: subject ? {
                        id: subject.id,
                        code: subject.code,
                        name: subject.name,
                        section: subject.section
                    } : null,
                    createdAt: entry.createdAt
                }
            })
        )

        return res.json({ entries: entriesWithSubjects.filter(e => e !== null) })
    } catch (err: any) {
        console.error('Error fetching student attendance entries:', err)
        return res.status(500).json({ error: err?.message || 'Failed to fetch attendance entries' })
    }
})

// Simple student summary (present/absent counts)
attendanceRouter.get('/student/:studentId/summary', verifyFirebaseToken, async (req, res) => {
    const { studentId } = req.params
    const entries = await AttendanceEntry.findAll({ where: { studentId } })
    const present = entries.filter((e: any) => e.present).length
    const absent = entries.length - present
    return res.json({ studentId, present, absent, total: entries.length })
})

// Search attendance sessions by subjectId and optional date
attendanceRouter.get('/sessions', verifyFirebaseToken, async (req, res) => {
    try {
        const { subjectId, date } = req.query as { subjectId?: string; date?: string }
        
        if (!subjectId) {
            return res.status(400).json({ error: 'subjectId is required' })
        }

        // If subjectId looks like a code (e.g., "23CSP101" or "SUBJ-23CSP101"), look it up
        let actualSubjectId = subjectId
        const { Subject } = await import('../models/Subject.js')
        if (!subjectId.includes('-') || subjectId.startsWith('SUBJ-')) {
            const code = subjectId.replace('SUBJ-', '')
            const subject = await Subject.findOne({ where: { code } })
            if (subject) {
                actualSubjectId = subject.id
            }
        }

        const whereClause: any = { subjectId: actualSubjectId }
        
        if (date) {
            whereClause.date = date
        }

        const sessions = await AttendanceSession.findAll({
            where: whereClause,
            order: [['date', 'DESC'], ['period', 'ASC']]
        })

        // Get completion status for each session
        const sessionsWithStatus = await Promise.all(
            sessions.map(async (session) => {
                const entries = await AttendanceEntry.findAll({ where: { sessionId: session.id } })
                const totalEntries = entries.length
                const completed = totalEntries > 0

                // Parse date to format it nicely
                const dateObj = new Date(session.date + 'T00:00:00') // Ensure proper parsing
                const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                const dayName = dayNames[dateObj.getDay()]
                
                // Format date as "DD, MMM YYYY"
                const formattedDate = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, ', ')

                // Format period with time if available
                const periodDisplay = session.period

                return {
                    id: session.id,
                    subjectId: session.subjectId,
                    date: session.date,
                    formattedDate,
                    dayName,
                    period: periodDisplay,
                    completed,
                    totalStudents: totalEntries,
                    createdAt: session.createdAt,
                    updatedAt: session.updatedAt
                }
            })
        )

        return res.json({ sessions: sessionsWithStatus })
    } catch (err: any) {
        console.error('Error fetching attendance sessions:', err)
        return res.status(500).json({ error: err?.message || 'Failed to fetch attendance sessions' })
    }
})

// Get attendance entries for a specific session
attendanceRouter.get('/session/:sessionId/entries', verifyFirebaseToken, async (req, res) => {
    try {
        const { sessionId } = req.params
        const uid = (req as any).uid as string
        const email = (req as any).email as string | undefined

        // Verify user is staff/admin
        const { User } = await import('../models/User.js')
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

        const entries = await AttendanceEntry.findAll({
            where: { sessionId },
            order: [['studentId', 'ASC']]
        })

        return res.json({ entries })
    } catch (error: any) {
        console.error('Error fetching session entries:', error)
        return res.status(500).json({ error: error.message || 'Failed to fetch session entries' })
    }
})

// Get students enrolled in a subject
attendanceRouter.get('/subject/:subjectId/students', verifyFirebaseToken, async (req, res) => {
    try {
        const { subjectId } = req.params
        const uid = (req as any).uid as string
        const email = (req as any).email as string | undefined

        // Resolve current user (prefer email in demo mode)
        const { User } = await import('../models/User.js')
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

        // If subjectId looks like a code (e.g., "23CSP101" or "SUBJ-23CSP101"), look it up
        let actualSubjectId = subjectId
        if (!subjectId.includes('-') || subjectId.startsWith('SUBJ-')) {
            const { Subject } = await import('../models/Subject.js')
            const code = subjectId.replace('SUBJ-', '')
            const subject = await Subject.findOne({ where: { code } })
            if (subject) {
                actualSubjectId = subject.id
            }
        }

        const { Enrollment } = await import('../models/Enrollment.js')
        const enrollments = await Enrollment.findAll({
            where: { subjectId: actualSubjectId },
            order: [['studentId', 'ASC']]
        })

        const students = await Promise.all(
            enrollments.map(async (enrollment) => {
                const student = await User.findByPk(enrollment.studentId)
                if (!student) return null
                // Extract roll number from email (e.g., student1@college.edu -> 1)
                const emailPrefix = student.email.split('@')[0]
                const rollMatch = emailPrefix.match(/student(\d+)/i)
                const num = rollMatch ? rollMatch[1] : emailPrefix.replace(/[^0-9]/g, '') || '0'
                const rollNo = `21BCS${num.padStart(3, '0')}`
                return {
                    id: student.id,
                    name: student.name || 'Unknown',
                    email: student.email,
                    rollNo: rollNo,
                    rollNoNum: parseInt(num, 10) // For sorting
                }
            })
        )

        // Sort by roll number (numeric part)
        const sortedStudents = students
            .filter(s => s !== null)
            .sort((a, b) => {
                if (!a || !b) return 0
                return a.rollNoNum - b.rollNoNum
            })
            .map(({ rollNoNum, ...rest }) => rest) // Remove rollNoNum from response

        return res.json({ students: sortedStudents })
    } catch (error: any) {
        console.error('Error fetching enrolled students:', error)
        return res.status(500).json({ error: error.message || 'Failed to fetch students' })
    }
})

attendanceRouter.get('/student-by-roll/:rollNo', verifyFirebaseToken, async (req, res) => {
    try {
        const uid = (req as any).uid as string
        const email = (req as any).email as string | undefined

        const user = await ensureStaffOrAdmin(uid, email)
        if (!user) {
            return res.status(403).json({ error: 'Unauthorized. Staff or admin access required.' })
        }

        const rollNoRaw = (req.params.rollNo || '').trim().toUpperCase()
        if (!rollNoRaw) {
            return res.status(400).json({ error: 'rollNo parameter is required' })
        }

        const { User } = await import('../models/User.js')
        const students = await User.findAll({ where: { role: 'student' } })
        const target = students.find((s: any) => {
            const derived = deriveRollNumber(s.email)
            return derived ? derived.toUpperCase() === rollNoRaw : false
        })

        if (!target) {
            return res.status(404).json({ error: 'Student not found for provided roll number' })
        }

        const entries = await AttendanceEntry.findAll({
            where: { studentId: target.id },
            order: [['createdAt', 'DESC']]
        })

        const { Subject } = await import('../models/Subject.js')
        const subjectIds = new Set<string>()
        const sessionIds = entries.map((entry: any) => entry.sessionId)
        const sessions = sessionIds.length
            ? await AttendanceSession.findAll({ where: { id: sessionIds } as any })
            : []
        const sessionById = new Map(sessions.map((s: any) => [s.id, s]))
        sessions.forEach((session: any) => subjectIds.add(session.subjectId))

        const subjects = subjectIds.size
            ? await Subject.findAll({ where: { id: Array.from(subjectIds) } as any })
            : []
        const subjectById = new Map(subjects.map((s: any) => [s.id, s]))

        const entriesWithSubjects = entries.map((entry: any) => {
            const session = sessionById.get(entry.sessionId)
            if (!session) return null
            const subject = subjectById.get(session.subjectId)
            return {
                id: entry.id,
                sessionId: entry.sessionId,
                studentId: entry.studentId,
                present: entry.present,
                date: session.date,
                period: session.period,
                subject: subject
                    ? {
                        id: subject.id,
                        code: subject.code,
                        name: subject.name,
                        section: subject.section
                    }
                    : null,
                createdAt: entry.createdAt
            }
        }).filter((entry): entry is NonNullable<typeof entry> => entry !== null)

        const sections = new Set<string>()
        entriesWithSubjects.forEach((entry) => {
            if (entry.subject?.section) {
                sections.add(entry.subject.section)
            }
        })

        return res.json({
            student: {
                id: target.id,
                name: target.name,
                email: target.email,
                rollNo: deriveRollNumber(target.email),
                sections: Array.from(sections)
            },
            entries: entriesWithSubjects
        })
    } catch (error: any) {
        console.error('Error fetching attendance by roll number:', error)
        return res.status(500).json({ error: error?.message || 'Failed to load attendance' })
    }
})

attendanceRouter.get('/overview', verifyFirebaseToken, async (req, res) => {
    try {
        const uid = (req as any).uid as string
        const email = (req as any).email as string | undefined
        const admin = await ensureAdmin(uid, email)
        if (!admin) {
            return res.status(403).json({ error: 'Unauthorized. Admin access required.' })
        }

        const { rollNo, limit } = req.query as { rollNo?: string; limit?: string }
        const { User } = await import('../models/User.js')

        let studentId: string | null = null
        if (rollNo) {
            const targetEmail = rollToEmail(rollNo) || rollNo
            const student = await User.findOne({ where: { email: targetEmail } })
            if (!student) {
                return res.json({ entries: [] })
            }
            studentId = student.id
        }

        const maxRows = limit ? Math.min(Number.parseInt(limit, 10) || 200, 500) : 200
        const entryWhere: any = {}
        if (studentId) entryWhere.studentId = studentId

        const entries = await AttendanceEntry.findAll({
            where: entryWhere,
            order: [['createdAt', 'DESC']],
            limit: maxRows
        })

        if (!entries.length) {
            return res.json({ entries: [] })
        }

        const sessionIds = Array.from(new Set(entries.map((e) => e.sessionId)))
        const studentIds = Array.from(new Set(entries.map((e) => e.studentId)))

        const [sessions, students] = await Promise.all([
            AttendanceSession.findAll({ where: { id: { [Op.in]: sessionIds } } as any }),
            User.findAll({ where: { id: { [Op.in]: studentIds } } as any })
        ])

        const subjectIds = Array.from(new Set(sessions.map((s) => s.subjectId)))
        const { Subject } = await import('../models/Subject.js')
        const subjects = await Subject.findAll({ where: { id: { [Op.in]: subjectIds } } as any })

        const sessionMap = new Map(sessions.map((s: any) => [s.id, s]))
        const studentMap = new Map(students.map((s: any) => [s.id, s]))
        const subjectMap = new Map(subjects.map((s: any) => [s.id, s]))

        const enriched = entries.map((entry) => {
            const session = sessionMap.get(entry.sessionId)
            const student = studentMap.get(entry.studentId)
            const subject = session ? subjectMap.get(session.subjectId) : null
            return {
                id: entry.id,
                studentId: entry.studentId,
                sessionId: entry.sessionId,
                status: entry.present ? 'present' : 'absent',
                createdAt: entry.createdAt,
                student: student ? {
                    id: student.id,
                    name: student.name,
                    email: student.email,
                    rollNumber: deriveRollNumber(student.email)
                } : null,
                session: session ? {
                    id: session.id,
                    date: session.date,
                    period: session.period,
                    subject: subject ? {
                        id: subject.id,
                        code: subject.code,
                        name: subject.name,
                        section: subject.section
                    } : null
                } : null
            }
        })

        return res.json({ entries: enriched })
    } catch (error: any) {
        console.error('Error fetching attendance overview:', error)
        return res.status(500).json({ error: error?.message || 'Failed to fetch attendance overview' })
    }
})


