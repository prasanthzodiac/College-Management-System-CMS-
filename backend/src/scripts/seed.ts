import 'dotenv/config'
import { randomUUID } from 'crypto'
import { initSequelize, sequelize } from '../database/index.js'

// Current date: 11.4.2025 at 10 AM
// Note: April 11, 2025 is a Friday
// One week ago would be April 4, 2025 (Friday)
// We'll create sessions for April 4-8, 2025 (Monday to Friday)
const currentDate = new Date('2025-04-11T10:00:00')
const oneWeekAgo = new Date('2025-04-04') // Start from April 4, 2025 (Friday of previous week)

async function seed() {
	try {
		// Initialize Sequelize first (this will import and register models)
		await initSequelize()
		console.log('Database connected')

		// Import models after Sequelize is initialized
		const { User } = await import('../models/User.js')
		const { Subject } = await import('../models/Subject.js')
		const { Enrollment } = await import('../models/Enrollment.js')
		const { AttendanceSession, AttendanceEntry } = await import('../models/Attendance.js')
		const { CertificateRequest } = await import('../models/CertificateRequest.js')
		const { InternalMark } = await import('../models/InternalMark.js')

		// Disable foreign key checks and drop all existing tables
		console.log('Synchronizing database schema...')
		await sequelize.query('SET FOREIGN_KEY_CHECKS = 0')
		
		// Get all tables in the database and drop them
		const [tables]: any = await sequelize.query(`
			SELECT TABLE_NAME 
			FROM INFORMATION_SCHEMA.TABLES 
			WHERE TABLE_SCHEMA = DATABASE()
		`)
		
		for (const row of tables) {
			const tableName = row.TABLE_NAME
			await sequelize.query(`DROP TABLE IF EXISTS \`${tableName}\``)
			console.log(`Dropped table: ${tableName}`)
		}
		
		// Now sync to create tables with correct schema
		await sequelize.sync()
		await sequelize.query('SET FOREIGN_KEY_CHECKS = 1')
		console.log('Database schema synchronized')

		// Create 5 Staff Members
		const staffMembers = [
			{ name: 'Dr. John Doe', email: 'staff1@college.edu', role: 'staff' as const },
			{ name: 'Dr. Jane Smith', email: 'staff2@college.edu', role: 'staff' as const },
			{ name: 'Prof. Robert Johnson', email: 'staff3@college.edu', role: 'staff' as const },
			{ name: 'Dr. Sarah Williams', email: 'staff4@college.edu', role: 'staff' as const },
			{ name: 'Prof. Michael Brown', email: 'staff5@college.edu', role: 'staff' as const }
		]

		const createdStaff = []
		for (const staff of staffMembers) {
			const user = await User.create({
				id: randomUUID(),
				email: staff.email,
				name: staff.name,
				role: staff.role
			})
			createdStaff.push(user)
			console.log(`Created staff: ${staff.email} (Password: password)`)
		}

		// Create 10 Students (1st Semester)
		const students = [
			{ name: 'Alice Johnson', email: 'student1@college.edu', rollNo: '21BCS001' },
			{ name: 'Bob Anderson', email: 'student2@college.edu', rollNo: '21BCS002' },
			{ name: 'Charlie Brown', email: 'student3@college.edu', rollNo: '21BCS003' },
			{ name: 'Diana Prince', email: 'student4@college.edu', rollNo: '21BCS004' },
			{ name: 'Ethan Hunt', email: 'student5@college.edu', rollNo: '21BCS005' },
			{ name: 'Fiona Apple', email: 'student6@college.edu', rollNo: '21BCS006' },
			{ name: 'George Washington', email: 'student7@college.edu', rollNo: '21BCS007' },
			{ name: 'Hannah Montana', email: 'student8@college.edu', rollNo: '21BCS008' },
			{ name: 'Ian Fleming', email: 'student9@college.edu', rollNo: '21BCS009' },
			{ name: 'Jessica Jones', email: 'student10@college.edu', rollNo: '21BCS010' }
		]

		const createdStudents = []
		for (const student of students) {
			const user = await User.create({
				id: randomUUID(),
				email: student.email,
				name: student.name,
				role: 'student'
			})
			createdStudents.push(user)
			console.log(`Created student: ${student.email} (Password: password)`)
		}

		// Create 1st Semester Subjects
		const subjects = [
			{ code: '23CSP101', name: 'Programming Fundamentals', section: 'I CSE A' },
			{ code: '23CST102', name: 'Data Structures', section: 'I CSE A' },
			{ code: '23CSL103', name: 'Programming Lab', section: 'I CSE A' },
			{ code: '23MAT104', name: 'Mathematics I', section: 'I CSE A' },
			{ code: '23ENG105', name: 'English Communication', section: 'I CSE A' }
		]

		const createdSubjects = []
		for (const subject of subjects) {
			const subj = await Subject.create({
				id: randomUUID(),
				code: subject.code,
				name: subject.name,
				section: subject.section
			})
			createdSubjects.push(subj)
			console.log(`Created subject: ${subject.code} - ${subject.name}`)
		}

		// Enroll all students in all subjects
		for (const student of createdStudents) {
			for (const subject of createdSubjects) {
				await Enrollment.create({
					id: randomUUID(),
					studentId: student.id,
					subjectId: subject.id
				})
			}
		}
		console.log('Enrolled all students in all subjects')

		// Create 1 week of attendance sessions (5 working days: Monday to Friday)
		// Starting from the most recent Monday (April 7, 2025 is a Monday)
		const periods = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']
		const mondayDate = new Date('2025-04-07') // Monday, April 7, 2025
		
		let totalSessions = 0
		let totalEntries = 0

		// Create sessions for each day of the week (Monday to Friday)
		for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
			const sessionDate = new Date(mondayDate)
			sessionDate.setDate(sessionDate.getDate() + dayOffset)
			const dateStr = sessionDate.toISOString().split('T')[0]
			const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
			const dayName = dayNames[dayOffset]

			console.log(`Creating attendance for ${dayName}, ${dateStr}...`)

			// Create sessions for each subject
			// Each subject typically has 1-2 sessions per day
			for (const subject of createdSubjects) {
				// Create 1-2 sessions per subject per day
				const sessionsPerDay = Math.floor(Math.random() * 2) + 1 // 1-2 sessions

				for (let sessionNum = 0; sessionNum < sessionsPerDay; sessionNum++) {
					// Use different periods for different sessions to avoid conflicts
					const periodIndex = (sessionNum * 2) % periods.length
					const period = periods[periodIndex]
					
					const session = await AttendanceSession.create({
						id: randomUUID(),
						subjectId: subject.id,
						date: dateStr,
						period: period
					})
					totalSessions++

					// Create attendance entries for ALL students in this session
					for (const student of createdStudents) {
						// More realistic attendance: 80-90% present rate
						// Some students have better attendance than others
						const basePresentRate = 0.85
						const studentVariation = Math.random() * 0.15 // 0-15% variation per student
						const isPresent = Math.random() < (basePresentRate - studentVariation)
						
						await AttendanceEntry.create({
							id: randomUUID(),
							sessionId: session.id,
							studentId: student.id,
							present: isPresent
						})
						totalEntries++
					}
				}
			}
		}

		console.log(`\nCreated 1 week of attendance data:`)
		console.log(`  - Total Sessions: ${totalSessions}`)
		console.log(`  - Total Attendance Entries: ${totalEntries}`)
		console.log(`  - Students: ${createdStudents.length}`)
		console.log(`  - Subjects: ${createdSubjects.length}`)

		// Create sample events
		const { Event } = await import('../models/Event.js')
		const { Circular } = await import('../models/Circular.js')
		const sampleEvents = [
			{
				title: 'Annual Tech Symposium',
				department: 'CSE',
				description: 'Three-day technical symposium with keynote sessions, workshops, and hackathons.',
				venue: 'Auditorium',
				startDate: '2025-11-10',
				endDate: '2025-11-12',
				contactName: 'Dr. Jane Smith',
				contactEmail: 'events@college.edu',
				contactPhone: '9876543210',
				status: 'Upcoming'
			},
			{
				title: 'Career Guidance Workshop',
				department: 'Placement Cell',
				description: 'Industry experts provide insights into career planning and interview preparation.',
				venue: 'Seminar Hall',
				startDate: '2025-11-18',
				endDate: '2025-11-18',
				contactName: 'Mr. Rahul Kumar',
				contactEmail: 'placement@college.edu',
				contactPhone: '9988776655',
				status: 'Upcoming'
			},
			{
				title: 'Cultural Fest - Sargam',
				department: 'Cultural Committee',
				description: 'Cultural extravaganza featuring dance, music, theatre, and art exhibitions.',
				venue: 'Open Air Theatre',
				startDate: '2025-12-05',
				endDate: '2025-12-06',
				contactName: 'Ms. Priya Menon',
				contactEmail: 'culture@college.edu',
				contactPhone: '9123456780',
				status: 'Upcoming'
			}
		]

		for (const evt of sampleEvents) {
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
				createdBy: createdStaff[0]?.id ?? null
			})
		}

		console.log('Created sample events')

		const sampleCirculars = [
			{
				circularNo: 'CIR-2025-07',
				title: 'Attendance Policy & Leave/Permission Apply through CMS Portal',
				description: 'Updated process for applying leave/permission via CMS portal effective immediately.',
				department: 'Administration',
				issuedDate: '2025-10-10',
				attachmentUrl: null
			},
			{
				circularNo: 'CIR-2025-08',
				title: 'Semester Examination Guidelines',
				description: 'Revised guidelines for semester examinations and valuation process.',
				department: 'Controller of Examinations',
				issuedDate: '2025-10-22',
				attachmentUrl: null
			}
		]

		for (const circular of sampleCirculars) {
			await Circular.create({
				id: randomUUID(),
				circularNo: circular.circularNo,
				title: circular.title,
				description: circular.description,
				department: circular.department,
				issuedDate: circular.issuedDate,
				attachmentUrl: circular.attachmentUrl,
				createdBy: createdStaff[0]?.id ?? null
			})
		}
		console.log('Created sample circulars')

		const sampleInternalAssessments = [
			{ name: 'Internal Test 1', date: '2025-09-15', max: 50 },
			{ name: 'Internal Test 2', date: '2025-10-05', max: 50 },
			{ name: 'Quiz', date: '2025-09-25', max: 25 }
		]
		const staffRecorder = createdStaff[0]
		for (const subject of createdSubjects) {
			for (let i = 0; i < createdStudents.length; i++) {
				const student = createdStudents[i]
				const assessment = sampleInternalAssessments[i % sampleInternalAssessments.length]
				const obtained = Math.max(0, Math.min(assessment.max, Math.round(assessment.max * (0.6 + Math.random() * 0.35))))
				await InternalMark.create({
					id: randomUUID(),
					studentId: student.id,
					subjectId: subject.id,
					assessmentName: assessment.name,
					maxMark: assessment.max,
					obtainedMark: obtained,
					recordedAt: assessment.date,
					createdBy: staffRecorder?.id || createdStaff[0].id,
					remarks: obtained >= assessment.max * 0.5 ? 'Good performance' : 'Needs improvement'
				})
			}
		}
		console.log('Seeded sample internal marks')

		console.log('\n=== Login Credentials ===')
		console.log('\nStaff Accounts (Password: password):')
		staffMembers.forEach(s => console.log(`  ${s.email} - ${s.name}`))
		console.log('\nStudent Accounts (Password: password):')
		students.forEach(s => console.log(`  ${s.email} - ${s.name} (${s.rollNo})`))
		console.log('\nDatabase seeding completed successfully!')

		await sequelize.close()
		process.exit(0)
	} catch (error) {
		console.error('Error seeding database:', error)
		process.exit(1)
	}
}

seed()

