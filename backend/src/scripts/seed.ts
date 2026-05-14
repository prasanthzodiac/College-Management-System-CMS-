import 'dotenv/config'
import { randomUUID } from 'crypto'
import { initSequelize, sequelize } from '../database/index.js'

const PERIODS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'] as const

/** Local calendar YYYY-MM-DD */
function toLocalYMD(d: Date): string {
	const y = d.getFullYear()
	const m = String(d.getMonth() + 1).padStart(2, '0')
	const day = String(d.getDate()).padStart(2, '0')
	return `${y}-${m}-${day}`
}

/** Monday 00:00; `labels` = Mon–Sat YYYY-MM-DD (staff timetable default window). */
function getThisWeekMondaySaturday(): { monday: Date; labels: string[] } {
	const today = new Date()
	const dow = today.getDay()
	const mondayOffset = dow === 0 ? -6 : 1 - dow
	const monday = new Date(today)
	monday.setDate(today.getDate() + mondayOffset)
	monday.setHours(0, 0, 0, 0)
	const labels: string[] = []
	for (let i = 0; i < 6; i++) {
		const d = new Date(monday)
		d.setDate(monday.getDate() + i)
		labels.push(toLocalYMD(d))
	}
	const saturday = new Date(monday)
	saturday.setDate(monday.getDate() + 5)
	return { monday, labels }
}

async function seed() {
	try {
		await initSequelize()
		console.log('Database connected')

		const { User } = await import('../models/User.js')
		const { Subject } = await import('../models/Subject.js')
		const { Enrollment } = await import('../models/Enrollment.js')
		const { StaffSubject } = await import('../models/StaffSubject.js')
		const { AttendanceSession, AttendanceEntry } = await import('../models/Attendance.js')
		const { InternalMark } = await import('../models/InternalMark.js')
		const { Event } = await import('../models/Event.js')
		const { Circular } = await import('../models/Circular.js')
		const { Assignment } = await import('../models/Assignment.js')
		const { AssignmentSubmission } = await import('../models/AssignmentSubmission.js')
		const { LeaveRequest } = await import('../models/Leave.js')
		const { Grievance } = await import('../models/Grievance.js')
		const { Feedback } = await import('../models/Feedback.js')
		const { CertificateRequest } = await import('../models/CertificateRequest.js')

		console.log('Synchronizing database schema (drops all tables)...')
		await sequelize.query('SET FOREIGN_KEY_CHECKS = 0')
		const [tables]: any = await sequelize.query(`
			SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE()
		`)
		for (const row of tables) {
			await sequelize.query(`DROP TABLE IF EXISTS \`${row.TABLE_NAME}\``)
		}
		await sequelize.sync()
		await sequelize.query('SET FOREIGN_KEY_CHECKS = 1')
		console.log('Database schema synchronized')

		// --- Admin (Login page references admin@college.edu) ---
		const adminUser = await User.create({
			id: randomUUID(),
			email: 'admin@college.edu',
			name: 'System Admin',
			role: 'admin',
		})
		console.log('Created admin:', adminUser.email)

		// --- 5 staff ---
		const staffMembers = [
			{ name: 'Dr. John Doe', email: 'staff1@college.edu', role: 'staff' as const },
			{ name: 'Dr. Jane Smith', email: 'staff2@college.edu', role: 'staff' as const },
			{ name: 'Prof. Robert Johnson', email: 'staff3@college.edu', role: 'staff' as const },
			{ name: 'Dr. Sarah Williams', email: 'staff4@college.edu', role: 'staff' as const },
			{ name: 'Prof. Michael Brown', email: 'staff5@college.edu', role: 'staff' as const },
		]
		const createdStaff: Awaited<ReturnType<typeof User.create>>[] = []
		for (const staff of staffMembers) {
			createdStaff.push(
				await User.create({
					id: randomUUID(),
					email: staff.email,
					name: staff.name,
					role: staff.role,
				})
			)
			console.log('Created staff:', staff.email)
		}

		// --- 8 students (roll numbers align with attendance roll helpers: studentN@college.edu -> 21BCS00N) ---
		const students = [
			{ name: 'Alice Johnson', email: 'student1@college.edu', rollNo: '21BCS001' },
			{ name: 'Bob Anderson', email: 'student2@college.edu', rollNo: '21BCS002' },
			{ name: 'Charlie Brown', email: 'student3@college.edu', rollNo: '21BCS003' },
			{ name: 'Diana Prince', email: 'student4@college.edu', rollNo: '21BCS004' },
			{ name: 'Ethan Hunt', email: 'student5@college.edu', rollNo: '21BCS005' },
			{ name: 'Fiona Apple', email: 'student6@college.edu', rollNo: '21BCS006' },
			{ name: 'George Washington', email: 'student7@college.edu', rollNo: '21BCS007' },
			{ name: 'Hannah Montana', email: 'student8@college.edu', rollNo: '21BCS008' },
		]
		const createdStudents: Awaited<ReturnType<typeof User.create>>[] = []
		for (const student of students) {
			createdStudents.push(
				await User.create({
					id: randomUUID(),
					email: student.email,
					name: student.name,
					role: 'student',
				})
			)
			console.log('Created student:', student.email, student.rollNo)
		}

		// --- 5 subjects ---
		const subjectsDef = [
			{ code: '23CSP101', name: 'Programming Fundamentals', section: 'I CSE A' },
			{ code: '23CST102', name: 'Data Structures', section: 'I CSE A' },
			{ code: '23CSL103', name: 'Programming Lab', section: 'I CSE A' },
			{ code: '23MAT104', name: 'Mathematics I', section: 'I CSE A' },
			{ code: '23ENG105', name: 'English Communication', section: 'I CSE A' },
		]
		const createdSubjects: Awaited<ReturnType<typeof Subject.create>>[] = []
		for (const s of subjectsDef) {
			createdSubjects.push(await Subject.create({ id: randomUUID(), code: s.code, name: s.name, section: s.section }))
			console.log('Created subject:', s.code)
		}

		// --- StaffSubject: staff i teaches subject i (timetable + assignment ownership) ---
		for (let i = 0; i < createdSubjects.length; i++) {
			await StaffSubject.create({
				id: randomUUID(),
				staffId: createdStaff[i].id,
				subjectId: createdSubjects[i].id,
			})
		}
		console.log('Linked staff_subjects (5 rows)')

		// --- Enrollments: every student in every subject ---
		for (const student of createdStudents) {
			for (const subject of createdSubjects) {
				await Enrollment.create({
					id: randomUUID(),
					studentId: student.id,
					subjectId: subject.id,
				})
			}
		}
		console.log('Enrollments:', createdStudents.length * createdSubjects.length)

		// --- Timetable: attendance sessions Mon–Sat THIS week (staff dashboard default range) ---
		const { monday, labels: weekDates } = getThisWeekMondaySaturday()
		let totalSessions = 0
		let totalEntries = 0
		for (let dayIdx = 0; dayIdx < 6; dayIdx++) {
			const dateStr = weekDates[dayIdx]
			for (let sIdx = 0; sIdx < createdSubjects.length; sIdx++) {
				const subject = createdSubjects[sIdx]
				const period = PERIODS[(dayIdx + sIdx) % PERIODS.length]
				const session = await AttendanceSession.create({
					id: randomUUID(),
					subjectId: subject.id,
					date: dateStr,
					period,
				})
				totalSessions++
				for (const student of createdStudents) {
					const present = Math.random() < 0.88
					await AttendanceEntry.create({
						id: randomUUID(),
						sessionId: session.id,
						studentId: student.id,
						present,
					})
					totalEntries++
				}
			}
		}
		console.log('Attendance sessions (this week):', totalSessions, 'entries:', totalEntries)

		// --- Internal marks ---
		const assessments = [
			{ name: 'Internal Test 1', date: '2025-09-15', max: 50 },
			{ name: 'Internal Test 2', date: '2025-10-05', max: 50 },
			{ name: 'Quiz', date: '2025-09-25', max: 25 },
		]
		const recorder = createdStaff[0]
		for (const subject of createdSubjects) {
			for (let i = 0; i < createdStudents.length; i++) {
				const student = createdStudents[i]
				const a = assessments[i % assessments.length]
				const obtained = Math.max(0, Math.min(a.max, Math.round(a.max * (0.62 + Math.random() * 0.33))))
				await InternalMark.create({
					id: randomUUID(),
					studentId: student.id,
					subjectId: subject.id,
					assessmentName: a.name,
					maxMark: a.max,
					obtainedMark: obtained,
					recordedAt: a.date,
					createdBy: recorder.id,
					remarks: obtained >= a.max * 0.5 ? 'Good performance' : 'Needs improvement',
				})
			}
		}
		console.log('Internal marks seeded')

		// --- Events & circulars (future-friendly dates) ---
		const y = monday.getFullYear()
		const m = monday.getMonth() + 1
		const ev1 = `${y}-${String(m).padStart(2, '0')}-20`
		const ev2 = `${y}-${String(Math.min(m + 1, 12)).padStart(2, '0')}-05`
		for (const evt of [
			{
				title: 'Annual Tech Symposium',
				department: 'CSE',
				description: 'Technical symposium with workshops and project expo.',
				venue: 'Auditorium',
				startDate: ev1,
				endDate: ev1,
				contactName: 'Dr. Jane Smith',
				contactEmail: 'events@college.edu',
				contactPhone: '9876543210',
				status: 'Upcoming',
			},
			{
				title: 'Career Guidance Workshop',
				department: 'Placement Cell',
				description: 'Interview preparation and resume reviews.',
				venue: 'Seminar Hall',
				startDate: ev2,
				endDate: ev2,
				contactName: 'Placement Office',
				contactEmail: 'placement@college.edu',
				contactPhone: '9988776655',
				status: 'Upcoming',
			},
		]) {
			await Event.create({
				id: randomUUID(),
				title: evt.title,
				description: evt.description,
				department: evt.department,
				venue: evt.venue,
				startDate: evt.startDate,
				endDate: evt.endDate,
				contactName: evt.contactName,
				contactEmail: evt.contactEmail,
				contactPhone: evt.contactPhone,
				status: evt.status,
				attachmentUrl: null,
				createdBy: createdStaff[0].id,
			})
		}
		for (const c of [
			{
				circularNo: 'CIR-2025-07',
				title: 'Attendance Policy — CMS Portal',
				description: 'Apply leave/permission through the CMS portal.',
				department: 'Administration',
				issuedDate: weekDates[0],
				attachmentUrl: null as string | null,
			},
			{
				circularNo: 'CIR-2025-08',
				title: 'Semester Examination Guidelines',
				description: 'Exam schedule and hall regulations.',
				department: 'CoE',
				issuedDate: weekDates[1],
				attachmentUrl: null,
			},
		]) {
			await Circular.create({
				id: randomUUID(),
				circularNo: c.circularNo,
				title: c.title,
				description: c.description,
				department: c.department,
				issuedDate: c.issuedDate,
				attachmentUrl: c.attachmentUrl,
				createdBy: createdStaff[0].id,
			})
		}
		console.log('Events + circulars seeded')

		// --- Assignments (2 per subject, owned by assigned staff) ---
		const due = new Date(monday)
		due.setDate(due.getDate() + 14)
		const dueStr = toLocalYMD(due)
		for (let i = 0; i < createdSubjects.length; i++) {
			const subj = createdSubjects[i]
			const staff = createdStaff[i]
			for (const [title, desc] of [
				['Problem Set 1', 'Solve chapter-end exercises.'],
				['Lab Report 1', 'Submit observation and code zip.'],
			] as const) {
				await Assignment.create({
					id: randomUUID(),
					subjectId: subj.id,
					subjectCode: subj.code,
					subjectName: subj.name,
					assignmentName: title,
					description: desc,
					dueDate: dueStr,
					minMark: 0,
					maxMark: 100,
					createdBy: staff.id,
				})
			}
		}
		console.log('Assignments:', createdSubjects.length * 2)

		// --- Two submissions (students 1–2 on first subject first assignment) ---
		const firstAssign = await Assignment.findOne({
			where: { subjectId: createdSubjects[0].id, assignmentName: 'Problem Set 1' } as any,
		})
		if (firstAssign) {
			for (const st of createdStudents.slice(0, 2)) {
				await AssignmentSubmission.create({
					id: randomUUID(),
					studentId: st.id,
					subjectCode: createdSubjects[0].code,
					subjectName: createdSubjects[0].name,
					assignmentName: 'Problem Set 1',
					staffName: createdStaff[0].name || 'Staff',
					attachmentUrl: 'https://example.edu/submissions/demo.pdf',
					submittedAt: new Date(),
					obtainedMark: null,
					minMark: 0,
					maxMark: 100,
					remarks: null,
					gradedAt: null,
					gradedBy: null,
				})
			}
			console.log('Assignment submissions: 2')
		}

		// --- Leaves ---
		await LeaveRequest.create({
			id: randomUUID(),
			studentId: createdStudents[0].id,
			fromDate: weekDates[0],
			toDate: weekDates[0],
			session: 'Full Day',
			type: 'Sick Leave',
			reason: 'Fever',
			halfday: false,
			hourly: false,
			status: 'pending',
		})
		await LeaveRequest.create({
			id: randomUUID(),
			studentId: createdStudents[1].id,
			fromDate: weekDates[2],
			toDate: null,
			session: 'FN',
			type: 'Permission',
			reason: 'Medical appointment',
			halfday: true,
			hourly: false,
			status: 'pending',
		})
		console.log('Leave requests: 2 pending')

		// --- Grievances ---
		await Grievance.create({
			id: randomUUID(),
			studentId: createdStudents[2].id,
			category: 'Academic',
			subCategory: 'Assessment',
			location: 'Block A',
			placeName: 'Room 101',
			subject: '23CST102',
			description: 'Request clarification on internal evaluation rubric.',
			fromDate: weekDates[1],
			toDate: null,
			status: 'open',
		})
		console.log('Grievances: 1 open')

		// --- Feedback ---
		await Feedback.create({
			id: randomUUID(),
			studentId: createdStudents[3].id,
			category: 'Teaching',
			subject: '23CSP101',
			message: 'Clear explanations and good lab support.',
			rating: 5,
			attachmentUrl: null,
		})
		await Feedback.create({
			id: randomUUID(),
			studentId: createdStudents[4].id,
			category: 'Infrastructure',
			subject: 'General',
			message: 'Wi‑Fi could be faster in hostel blocks.',
			rating: 3,
			attachmentUrl: null,
		})
		console.log('Feedback: 2')

		// --- Certificate requests ---
		await CertificateRequest.create({
			id: randomUUID(),
			studentId: createdStudents[5].id,
			certificateType: 'Bonafide',
			purpose: 'Summer internship application',
			status: 'pending',
		})
		await CertificateRequest.create({
			id: randomUUID(),
			studentId: createdStudents[6].id,
			certificateType: 'Course Completion',
			purpose: 'Higher studies admission',
			status: 'pending',
		})
		console.log('Certificate requests: 2 pending')

		console.log('\n=== Summary ===')
		console.log('Admin:', adminUser.email)
		console.log('Staff:', staffMembers.map((s) => s.email).join(', '))
		console.log('Students:', students.map((s) => s.email).join(', '))
		console.log('Timetable week (Mon–Sat):', weekDates.join(' → '))
		console.log('\nUse the same emails in Firebase Auth with your chosen passwords.')
		console.log('Seeding completed.')

		await sequelize.close()
		process.exit(0)
	} catch (error) {
		console.error('Error seeding database:', error)
		process.exit(1)
	}
}

seed()
