import 'dotenv/config'
import { initSequelize, sequelize } from '../database/index.js'

async function main() {
	await initSequelize()
	await sequelize.sync()

	// Import models after Sequelize is initialized
	const { User } = await import('../models/User.js')
	const { Enrollment } = await import('../models/Enrollment.js')
	const { AttendanceEntry, AttendanceSession } = await import('../models/Attendance.js')
	const { CertificateRequest } = await import('../models/CertificateRequest.js')
	const { Feedback } = await import('../models/Feedback.js')
	const { Grievance } = await import('../models/Grievance.js')
	const { LeaveRequest } = await import('../models/Leave.js')

	console.log('Finding and removing student with roll number 21BCS000...')

	// First, check current student count
	const initialStudents = await User.findAll({ where: { role: 'student' } })
	console.log(`Current student count: ${initialStudents.length}`)
	
	if (initialStudents.length <= 10) {
		console.log('✅ Database already has 10 or fewer students. No action needed.')
		await sequelize.close()
		process.exit(0)
	}

	// Find student with roll number 21BCS000 (student0@college.edu or student@college.edu)
	const studentEmail = 'student0@college.edu'
	const student = await User.findOne({ 
		where: { 
			email: studentEmail,
			role: 'student'
		}
	})

	if (!student) {
		console.log('Student with email student0@college.edu not found. Checking all students...')
		const allStudents = await User.findAll({ where: { role: 'student' } })
		console.log(`Found ${allStudents.length} students in database:`)
		for (const s of allStudents) {
			const emailPrefix = s.email.split('@')[0]
			const rollMatch = emailPrefix.match(/student(\d+)/i)
			const num = rollMatch ? rollMatch[1] : emailPrefix.replace(/[^0-9]/g, '') || '0'
			const rollNo = `21BCS${num.padStart(3, '0')}`
			console.log(`  - ${s.email} (${rollNo})`)
		}
		
		// Try to find student@college.edu (without number) which has roll number 21BCS000
		const studentWithoutNumber = await User.findOne({ where: { email: 'student@college.edu', role: 'student' } })
		if (studentWithoutNumber) {
			console.log(`\nFound student@college.edu with roll number 21BCS000, proceeding to delete...`)
			await deleteStudent(studentWithoutNumber.id)
		} else {
			// Try student0@college.edu
			const student0 = await User.findOne({ where: { email: 'student0@college.edu', role: 'student' } })
			if (student0) {
				console.log(`\nFound student0@college.edu, proceeding to delete...`)
				await deleteStudent(student0.id)
			} else {
				// Check if staff@college.edu is incorrectly marked as student
				const staffAsStudent = await User.findOne({ where: { email: 'staff@college.edu', role: 'student' } })
				if (staffAsStudent) {
					console.log(`\nFound staff@college.edu incorrectly marked as student, removing...`)
					await deleteStudent(staffAsStudent.id)
				} else {
					console.log('\nNo student found with roll number 21BCS000. Will remove extra students if count > 10.')
				}
			}
		}
	} else {
		console.log(`Found student: ${student.email} (ID: ${student.id})`)
		await deleteStudent(student.id)
	}

	// Verify we have exactly 10 students
	const remainingStudents = await User.findAll({ where: { role: 'student' } })
	console.log(`\n✅ Remaining students: ${remainingStudents.length}`)
	
	if (remainingStudents.length > 10) {
		console.log(`\n⚠️  Found ${remainingStudents.length} students. Need to remove ${remainingStudents.length - 10} more student(s).`)
		console.log('Remaining students:')
		for (const s of remainingStudents) {
			const emailPrefix = s.email.split('@')[0]
			const rollMatch = emailPrefix.match(/student(\d+)/i)
			const num = rollMatch ? rollMatch[1] : emailPrefix.replace(/[^0-9]/g, '') || '0'
			const rollNo = `21BCS${num.padStart(3, '0')}`
			console.log(`  - ${s.email} (${rollNo})`)
		}
		
		// Find the student with the highest number and remove it
		const studentsWithNumbers = remainingStudents
			.map(s => {
				const emailPrefix = s.email.split('@')[0]
				const rollMatch = emailPrefix.match(/student(\d+)/i)
				const num = rollMatch ? parseInt(rollMatch[1], 10) : 0
				return { student: s, num }
			})
			.filter(s => s.num > 0)
			.sort((a, b) => b.num - a.num) // Sort descending
		
		// Remove students with number > 10 until we have exactly 10
		while (studentsWithNumbers.length > 0 && studentsWithNumbers[0].num > 10) {
			const toRemove = studentsWithNumbers[0].student
			console.log(`\nRemoving student ${toRemove.email} (number ${studentsWithNumbers[0].num})...`)
			await deleteStudent(toRemove.id)
			
			// Remove from list and recalculate
			studentsWithNumbers.shift()
			
			// Re-fetch remaining students
			const updatedStudents = await User.findAll({ where: { role: 'student' } })
			const updatedWithNumbers = updatedStudents
				.map(s => {
					const emailPrefix = s.email.split('@')[0]
					const rollMatch = emailPrefix.match(/student(\d+)/i)
					const num = rollMatch ? parseInt(rollMatch[1], 10) : 0
					return { student: s, num }
				})
				.filter(s => s.num > 0)
				.sort((a, b) => b.num - a.num)
			
			studentsWithNumbers.length = 0
			studentsWithNumbers.push(...updatedWithNumbers)
		}
		
		// Verify final count
		const finalStudents = await User.findAll({ where: { role: 'student' } })
		console.log(`\n✅ Final student count: ${finalStudents.length}`)
		if (finalStudents.length === 10) {
			console.log('✅ Successfully removed student(s). Database now has exactly 10 students.')
		} else if (finalStudents.length > 10) {
			console.log(`⚠️  Still have ${finalStudents.length} students. Listing remaining:`)
			for (const s of finalStudents) {
				console.log(`  - ${s.email}`)
			}
		}
	} else if (remainingStudents.length === 10) {
		console.log('✅ Successfully removed student. Database now has exactly 10 students.')
	} else {
		console.log(`⚠️  Warning: Expected 10 students, but found ${remainingStudents.length}`)
	}

	await sequelize.close()
	process.exit(0)
}

async function deleteStudent(studentId: string) {
	const { User } = await import('../models/User.js')
	const { Enrollment } = await import('../models/Enrollment.js')
	const { AttendanceEntry, AttendanceSession } = await import('../models/Attendance.js')
	const { CertificateRequest } = await import('../models/CertificateRequest.js')
	const { Feedback } = await import('../models/Feedback.js')
	const { Grievance } = await import('../models/Grievance.js')
	const { LeaveRequest } = await import('../models/Leave.js')

	console.log(`\nDeleting all records for student ${studentId}...`)

	// Delete attendance entries
	const attendanceEntries = await AttendanceEntry.findAll({ where: { studentId } })
	console.log(`  - Deleting ${attendanceEntries.length} attendance entries`)
	await AttendanceEntry.destroy({ where: { studentId } })

	// Delete enrollments
	const enrollments = await Enrollment.findAll({ where: { studentId } })
	console.log(`  - Deleting ${enrollments.length} enrollments`)
	await Enrollment.destroy({ where: { studentId } })

	// Delete certificate requests
	const certRequests = await CertificateRequest.findAll({ where: { studentId } })
	console.log(`  - Deleting ${certRequests.length} certificate requests`)
	await CertificateRequest.destroy({ where: { studentId } })

	// Delete feedback
	const feedbacks = await Feedback.findAll({ where: { studentId } })
	console.log(`  - Deleting ${feedbacks.length} feedback entries`)
	await Feedback.destroy({ where: { studentId } })

	// Delete grievances
	const grievances = await Grievance.findAll({ where: { studentId } })
	console.log(`  - Deleting ${grievances.length} grievances`)
	await Grievance.destroy({ where: { studentId } })

	// Delete leave requests
	const leaveRequests = await LeaveRequest.findAll({ where: { studentId } })
	console.log(`  - Deleting ${leaveRequests.length} leave requests`)
	await LeaveRequest.destroy({ where: { studentId } })

	// Finally, delete the user
	console.log(`  - Deleting user record`)
	await User.destroy({ where: { id: studentId } })

	console.log(`✅ Successfully deleted student ${studentId} and all related records`)
}

main().catch((err) => {
	console.error('Error:', err)
	process.exit(1)
})

