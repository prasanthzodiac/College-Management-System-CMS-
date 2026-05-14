import 'dotenv/config'
import { randomUUID } from 'crypto'
import { initSequelize, sequelize } from '../database/index.js'

async function main() {
	await initSequelize()
	await sequelize.sync()

	// Import models after Sequelize is initialized
	const { User } = await import('../models/User.js')
	const { Subject } = await import('../models/Subject.js')
	const { StaffSubject } = await import('../models/StaffSubject.js')
	const { Enrollment } = await import('../models/Enrollment.js')
	const { AttendanceSession, AttendanceEntry } = await import('../models/Attendance.js')

	console.log('Starting timetable and attendance generation...')

	// Get all staff members
	const staffMembers = await User.findAll({ where: { role: 'staff' } })
	console.log(`Found ${staffMembers.length} staff members`)

	// Get all students
	const students = await User.findAll({ where: { role: 'student' } })
	console.log(`Found ${students.length} students`)

	if (students.length === 0) {
		console.error('No students found in database')
		process.exit(1)
	}

	// Create 3 special subjects
	const specialSubjects = [
		{ code: 'FREE001', name: 'Free Period', section: 'ALL' },
		{ code: 'LIB001', name: 'Library Period', section: 'ALL' },
		{ code: 'ONL001', name: 'Online Course Period', section: 'ALL' }
	]

	const createdSpecialSubjects = []
	for (const subj of specialSubjects) {
		let subject = await Subject.findOne({ where: { code: subj.code } })
		if (!subject) {
			subject = await Subject.create({
				id: randomUUID(),
				code: subj.code,
				name: subj.name,
				section: subj.section
			})
			console.log(`Created subject: ${subj.code} - ${subj.name}`)
		} else {
			console.log(`Subject already exists: ${subj.code} - ${subj.name}`)
		}
		createdSpecialSubjects.push(subject)
	}

	// Assign special subjects to all staff members
	for (const staff of staffMembers) {
		for (const subject of createdSpecialSubjects) {
			const existing = await StaffSubject.findOne({
				where: { staffId: staff.id, subjectId: subject.id }
			})
			if (!existing) {
				await StaffSubject.create({
					id: randomUUID(),
					staffId: staff.id,
					subjectId: subject.id
				})
				console.log(`Assigned ${subject.code} to staff ${staff.email}`)
			}
		}
	}

	// Get all subjects (staff subjects + special subjects)
	const allStaffSubjects = await StaffSubject.findAll()
	const allSubjectIds = Array.from(new Set([
		...allStaffSubjects.map(ss => ss.subjectId),
		...createdSpecialSubjects.map(s => s.id)
	]))

	const allSubjects = await Subject.findAll({ where: { id: allSubjectIds } as any })
	console.log(`Total subjects: ${allSubjects.length}`)

	// Enroll all students in all subjects
	for (const student of students) {
		for (const subject of allSubjects) {
			const existing = await Enrollment.findOne({
				where: { studentId: student.id, subjectId: subject.id }
			})
			if (!existing) {
				await Enrollment.create({
					id: randomUUID(),
					studentId: student.id,
					subjectId: subject.id
				})
			}
		}
	}
	console.log(`Enrolled all ${students.length} students in all subjects`)

    // Create timetable: 8 periods per day, 6 days (Monday to Saturday)
	const periods = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
	
	// Get current week's dates (Monday to Friday)
	const today = new Date()
	const dayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, etc.
	const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
	const monday = new Date(today)
	monday.setDate(today.getDate() + mondayOffset)
	monday.setHours(0, 0, 0, 0)

	const weekDates: { date: Date; dayName: string }[] = []
    for (let i = 0; i < 6; i++) {
		const date = new Date(monday)
		date.setDate(monday.getDate() + i)
		weekDates.push({
			date,
			dayName: days[i]
		})
	}

	// Get special subjects
	const freePeriodSubject = allSubjects.find(s => s.code === 'FREE001')!
	const librarySubject = allSubjects.find(s => s.code === 'LIB001')!
	const onlineSubject = allSubjects.find(s => s.code === 'ONL001')!

	// Get regular subjects (staff assigned subjects, excluding special ones)
	const regularSubjects = allSubjects.filter(s => 
		!['FREE001', 'LIB001', 'ONL001'].includes(s.code)
	)

	// Create a fixed timetable structure
	// Each day has 8 periods:
	// Periods I-V: Regular subjects (distributed across days)
	// Period VI: Free Period
	// Period VII: Library Period  
	// Period VIII: Online Course Period

    // Distribute regular subjects across 6 days, 5 periods each = 30 slots
	// We'll cycle through subjects to fill all slots
	const timetable: { dayIndex: number; period: string; subject: typeof regularSubjects[0] }[] = []
    for (let dayIdx = 0; dayIdx < 6; dayIdx++) {
		for (let periodIdx = 0; periodIdx < 5; periodIdx++) {
			const subjectIdx = (dayIdx * 5 + periodIdx) % regularSubjects.length
			timetable.push({
				dayIndex: dayIdx,
				period: periods[periodIdx],
				subject: regularSubjects[subjectIdx]
			})
		}
	}

	console.log(`\nTimetable structure created:`)
	console.log(`  - 5 regular periods per day (I-V)`)
	console.log(`  - 3 special periods (VI: Free, VII: Library, VIII: Online)`)

	// Generate attendance for 1 week
	let sessionCount = 0
	let entryCount = 0

	for (let dayIdx = 0; dayIdx < weekDates.length; dayIdx++) {
		const { date, dayName } = weekDates[dayIdx]
		const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD format
		console.log(`\nGenerating attendance for ${dayName}, ${dateStr}`)

		// Periods I-V: Regular subjects from timetable
		const dayTimetable = timetable.filter(t => t.dayIndex === dayIdx)
		for (const { period, subject } of dayTimetable) {
			// Create attendance session
			const sessionId = randomUUID()
			await AttendanceSession.create({
				id: sessionId,
				subjectId: subject.id,
				date: dateStr,
				period: period
			})
			sessionCount++

			// Create attendance entries for all students
			for (const student of students) {
				// 85% chance of being present for regular classes
				const present = Math.random() > 0.15
				await AttendanceEntry.create({
					id: randomUUID(),
					sessionId,
					studentId: student.id,
					present
				})
				entryCount++
			}
		}

		// Period VI: Free Period
		const freeSessionId = randomUUID()
		await AttendanceSession.create({
			id: freeSessionId,
			subjectId: freePeriodSubject.id,
			date: dateStr,
			period: periods[5] // Period VI
		})
		sessionCount++
		for (const student of students) {
			await AttendanceEntry.create({
				id: randomUUID(),
				sessionId: freeSessionId,
				studentId: student.id,
				present: true // Free period - all present
			})
			entryCount++
		}

		// Period VII: Library Period
		const libSessionId = randomUUID()
		await AttendanceSession.create({
			id: libSessionId,
			subjectId: librarySubject.id,
			date: dateStr,
			period: periods[6] // Period VII
		})
		sessionCount++
		for (const student of students) {
			await AttendanceEntry.create({
				id: randomUUID(),
				sessionId: libSessionId,
				studentId: student.id,
				present: Math.random() > 0.1 // 90% present for library
			})
			entryCount++
		}

		// Period VIII: Online Course Period
		const onlineSessionId = randomUUID()
		await AttendanceSession.create({
			id: onlineSessionId,
			subjectId: onlineSubject.id,
			date: dateStr,
			period: periods[7] // Period VIII
		})
		sessionCount++
		for (const student of students) {
			await AttendanceEntry.create({
				id: randomUUID(),
				sessionId: onlineSessionId,
				studentId: student.id,
				present: Math.random() > 0.05 // 95% present for online course
			})
			entryCount++
		}
	}

	console.log(`\n✅ Successfully generated:`)
	console.log(`   - ${sessionCount} attendance sessions`)
	console.log(`   - ${entryCount} attendance entries`)
	console.log(`   - For ${students.length} students`)
	console.log(`   - Across ${allSubjects.length} subjects`)
    console.log(`   - For 6 days (Mon-Sat)`)

	await sequelize.close()
	process.exit(0)
}

main().catch((err) => {
	console.error('Error:', err)
	process.exit(1)
})

