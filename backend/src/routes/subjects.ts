import { Router } from 'express'
import { verifyFirebaseToken } from '../services/firebaseAdmin.js'
import { Subject } from '../models/Subject.js'
import { StaffSubject } from '../models/StaffSubject.js'
import { randomUUID } from 'crypto'
import { User } from '../models/User.js'

export const subjectRouter = Router()

// Get all subjects
subjectRouter.get('/', verifyFirebaseToken, async (req, res) => {
    try {
        const subjects = await Subject.findAll({
            order: [['code', 'ASC']]
        })
        return res.json({ subjects })
    } catch (error: any) {
        console.error('Error fetching subjects:', error)
        return res.status(500).json({ error: error.message || 'Failed to fetch subjects' })
    }
})

// Get program outcomes with subjects mapping
subjectRouter.get('/program-outcomes', verifyFirebaseToken, async (req, res) => {
    try {
        // Get all subjects
        const subjects = await Subject.findAll({
            order: [['code', 'ASC']]
        })

        // Standard Program Outcomes (PO)
        const programOutcomes = [
            { code: 'PO1', title: 'Engineering Knowledge', desc: 'Apply the knowledge of mathematics, science, engineering fundamentals, and an engineering specialization to the solution of complex engineering problems.' },
            { code: 'PO2', title: 'Problem Analysis', desc: 'Identify, formulate, review research literature, and analyze complex engineering problems reaching substantiated conclusions using first principles of mathematics, natural sciences, and engineering sciences.' },
            { code: 'PO3', title: 'Design/Development of Solutions', desc: 'Design solutions for complex engineering problems and design system components or processes that meet the specified needs with appropriate consideration for the public health and safety, and the cultural, societal, and environmental considerations.' },
            { code: 'PO4', title: 'Conduct Investigations of Complex Problems', desc: 'Use research-based knowledge and research methods including design of experiments, analysis and interpretation of data, and synthesis of the information to provide valid conclusions.' },
            { code: 'PO5', title: 'Modern Tool Usage', desc: 'Create, select, and apply appropriate techniques, resources, and modern engineering and IT tools including prediction and modeling to complex engineering activities with an understanding of the limitations.' },
            { code: 'PO6', title: 'The Engineer and Society', desc: 'Apply reasoning informed by the contextual knowledge to assess societal, health, safety, legal and cultural issues and the consequent responsibilities relevant to the professional engineering practice.' },
            { code: 'PO7', title: 'Environment and Sustainability', desc: 'Understand the impact of the professional engineering solutions in societal and environmental contexts, and demonstrate the knowledge of, and need for sustainable development.' },
            { code: 'PO8', title: 'Ethics', desc: 'Apply ethical principles and commit to professional ethics and responsibilities and norms of the engineering practice.' },
            { code: 'PO9', title: 'Individual and Team Work', desc: 'Function effectively as an individual, and as a member or leader in diverse teams, and in multidisciplinary settings.' },
            { code: 'PO10', title: 'Communication', desc: 'Communicate effectively on complex engineering activities with the engineering community and with society at large, such as, being able to comprehend and write effective reports and design documentation, make effective presentations, and give and receive clear instructions.' },
            { code: 'PO11', title: 'Project Management and Finance', desc: 'Demonstrate knowledge and understanding of the engineering and management principles and apply these to one\'s own work, as a member and leader in a team, to manage projects and in multidisciplinary environments.' },
            { code: 'PO12', title: 'Life-long Learning', desc: 'Recognize the need for, and have the preparation and ability to engage in independent and life-long learning in the broadest context of technological change.' }
        ]

        // Program Specific Outcomes (PSO)
        const programSpecificOutcomes = [
            { code: 'PSO1', desc: 'Design and develop full‑stack web applications using modern JavaScript frameworks, cloud services, and database technologies to solve real-world problems.' },
            { code: 'PSO2', desc: 'Design relational and NoSQL data models, write optimized queries, implement security best practices, and apply DevOps principles for efficient deployment and maintenance of software systems.' },
            { code: 'PSO3', desc: 'Apply software engineering principles, design patterns, and agile methodologies to develop scalable, maintainable, and robust software solutions.' }
        ]

        // Map subjects to relevant POs (based on subject type)
        const subjectPOMapping: Record<string, string[]> = {}
        subjects.forEach((subject: any) => {
            const code = subject.code.toLowerCase()
            const name = subject.name.toLowerCase()
            const mappedPOs: string[] = []

            // Programming/CS subjects typically cover PO1, PO2, PO3, PO5
            if (code.includes('csp') || code.includes('cst') || code.includes('csl') || name.includes('programming') || name.includes('data structure')) {
                mappedPOs.push('PO1', 'PO2', 'PO3', 'PO5')
            }
            // Math subjects cover PO1, PO4
            if (code.includes('mat') || name.includes('mathematics')) {
                mappedPOs.push('PO1', 'PO4')
            }
            // Communication subjects cover PO6, PO10
            if (code.includes('eng') || name.includes('communication') || name.includes('english')) {
                mappedPOs.push('PO6', 'PO10')
            }
            // All subjects contribute to PO9, PO12
            mappedPOs.push('PO9', 'PO12')

            // Remove duplicates
            subjectPOMapping[subject.id] = Array.from(new Set(mappedPOs))
        })

        return res.json({
            programOutcomes,
            programSpecificOutcomes,
            subjects: subjects.map((s: any) => ({
                id: s.id,
                code: s.code,
                name: s.name,
                section: s.section,
                mappedPOs: subjectPOMapping[s.id] || []
            }))
        })
    } catch (error: any) {
        console.error('Error fetching program outcomes:', error)
        return res.status(500).json({ error: error.message || 'Failed to fetch program outcomes' })
    }
})

// Get subject by code
subjectRouter.get('/code/:code', verifyFirebaseToken, async (req, res) => {
    try {
        const { code } = req.params
        const subject = await Subject.findOne({ where: { code } })
        if (!subject) {
            return res.status(404).json({ error: 'Subject not found' })
        }
        return res.json({ subject })
    } catch (error: any) {
        console.error('Error fetching subject:', error)
        return res.status(500).json({ error: error.message || 'Failed to fetch subject' })
    }
})

// Get subject by ID
subjectRouter.get('/:id', verifyFirebaseToken, async (req, res) => {
    try {
        const { id } = req.params
        const subject = await Subject.findByPk(id)
        if (!subject) {
            return res.status(404).json({ error: 'Subject not found' })
        }
        return res.json({ subject })
    } catch (error: any) {
        console.error('Error fetching subject:', error)
        return res.status(500).json({ error: error.message || 'Failed to fetch subject' })
    }
})

// Get assigned subjects for current staff; if none, auto-create
subjectRouter.get('/staff/assigned/current', verifyFirebaseToken, async (req, res) => {
    try {
        const uid = (req as any).uid as string
        const email = (req as any).email as string | undefined
        let staff = null as any
        if (email) staff = await User.findOne({ where: { email } })
        if (!staff) staff = await User.findByPk(uid)
        if (!staff || staff.role !== 'staff') return res.status(403).json({ error: 'Only staff can access this' })

        const links = await StaffSubject.findAll({ where: { staffId: staff.id } })
        let subjects = [] as any[]
        
        // Ensure special subjects exist and are assigned to this staff
        const specialSubjectCodes = ['FREE001', 'LIB001', 'ONL001']
        const specialSubjects = []
        
        for (const code of specialSubjectCodes) {
            let subject = await Subject.findOne({ where: { code } })
            if (!subject) {
                // Create special subject if it doesn't exist
                const names: Record<string, string> = {
                    'FREE001': 'Free Period',
                    'LIB001': 'Library Period',
                    'ONL001': 'Online Course Period'
                }
                subject = await Subject.create({
                    id: randomUUID(),
                    code,
                    name: names[code],
                    section: 'ALL'
                })
            }
            specialSubjects.push(subject)
            
            // Ensure staff is assigned to this special subject
            const existingLink = await StaffSubject.findOne({
                where: { staffId: staff.id, subjectId: subject.id }
            })
            if (!existingLink) {
                await StaffSubject.create({
                    id: randomUUID(),
                    staffId: staff.id,
                    subjectId: subject.id
                })
            }
        }
        
        if (links.length === 0) {
            // Create one placeholder subject for this staff if none exist
            const staffNum = (staff.email || 'X').match(/\d+/)?.[0] || 'X'
            const defaultSubjects = [
                { code: '23CSP101', name: 'Programming Fundamentals' },
                { code: '23CST102', name: 'Data Structures' },
                { code: '23CSL103', name: 'Programming Lab' },
                { code: '23MAT104', name: 'Mathematics I' },
                { code: '23ENG105', name: 'English Communication' }
            ]
            const idx = parseInt(staffNum) - 1
            const defaultSubj = defaultSubjects[idx] || defaultSubjects[0]
            const s1 = await Subject.findOne({ where: { code: defaultSubj.code } }) || await Subject.create({ 
                id: randomUUID(), 
                code: defaultSubj.code, 
                name: defaultSubj.name, 
                section: 'I CSE A' 
            })
            await StaffSubject.create({ id: randomUUID(), staffId: staff.id, subjectId: s1.id })
            subjects = [s1, ...specialSubjects]
        } else {
            const ids = links.map(l => l.subjectId)
            const regularSubjects = await Subject.findAll({ where: { id: ids } as any, order: [['code','ASC']] })
            // Combine regular subjects with special subjects
            const allSubjectIds = [...ids, ...specialSubjects.map(s => s.id)]
            subjects = await Subject.findAll({ where: { id: allSubjectIds } as any, order: [['code','ASC']] })
        }
        
        // Get statistics for each subject
        const { AttendanceSession, AttendanceEntry } = await import('../models/Attendance.js')
        const { Enrollment } = await import('../models/Enrollment.js')
        const { Assignment } = await import('../models/Assignment.js')
        
        const subjectIds = subjects.map((s: any) => s.id)
        
        // Batch fetch all data
        const [allSessions, allEnrollments, allAssignments] = await Promise.all([
            AttendanceSession.findAll({ where: { subjectId: subjectIds } as any }),
            Enrollment.findAll({ where: { subjectId: subjectIds } as any }),
            Assignment.findAll({ where: { subjectId: subjectIds } as any })
        ])
        
        // Get session IDs and fetch entries only for those sessions
        const sessionIds = allSessions.map((s: any) => s.id)
        const allEntries = sessionIds.length > 0 
            ? await AttendanceEntry.findAll({ where: { sessionId: sessionIds } as any })
            : []
        
        // Create maps for efficient lookup
        const sessionsBySubject = new Map<string, any[]>()
        const enrollmentsBySubject = new Map<string, number>()
        const entriesBySession = new Map<string, number>()
        const assignmentsBySubject = new Map<string, number>()
        
        // Group sessions by subject
        for (const session of allSessions) {
            if (!sessionsBySubject.has(session.subjectId)) {
                sessionsBySubject.set(session.subjectId, [])
            }
            sessionsBySubject.get(session.subjectId)!.push(session)
        }
        
        // Count enrollments by subject
        for (const enrollment of allEnrollments) {
            enrollmentsBySubject.set(
                enrollment.subjectId,
                (enrollmentsBySubject.get(enrollment.subjectId) || 0) + 1
            )
        }
        
        // Count entries by session
        for (const entry of allEntries) {
            entriesBySession.set(
                entry.sessionId,
                (entriesBySession.get(entry.sessionId) || 0) + 1
            )
        }
        
        // Count assignments by subject
        for (const assignment of allAssignments) {
            assignmentsBySubject.set(
                assignment.subjectId,
                (assignmentsBySubject.get(assignment.subjectId) || 0) + 1
            )
        }
        
        // Calculate stats for each subject
        const subjectsWithStats = subjects.map((subject: any) => {
            const sessions = sessionsBySubject.get(subject.id) || []
            const totalSessions = sessions.length
            let pendingCount = 0
            
            for (const session of sessions) {
                const entryCount = entriesBySession.get(session.id) || 0
                if (entryCount === 0) {
                    pendingCount++
                }
            }
            
            const totalStudents = enrollmentsBySubject.get(subject.id) || 0
            const totalAssignments = assignmentsBySubject.get(subject.id) || 0
            
            return {
                ...subject.toJSON(),
                stats: {
                    totalPeriods: totalSessions,
                    allocatedHours: totalSessions, // Same as periods for now
                    pendingAttendance: totalSessions > 0 ? `${pendingCount}/${totalSessions}` : '0/0',
                    completedAttendance: totalSessions - pendingCount,
                    totalStudents: totalStudents,
                    assignment: `${totalAssignments}/${totalAssignments}` // Total assignments created
                }
            }
        })

        return res.json({ subjects: subjectsWithStats })
    } catch (error: any) {
        console.error('Error fetching staff assigned subjects:', error)
        return res.status(500).json({ error: error.message || 'Failed to fetch assigned subjects' })
    }
})

