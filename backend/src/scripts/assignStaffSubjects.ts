import 'dotenv/config'
import { initSequelize, sequelize } from '../database/index.js'
import { randomUUID } from 'crypto'

async function main() {
  try {
    await initSequelize()
    const { User } = await import('../models/User.js')
    const { Subject } = await import('../models/Subject.js')
    const { StaffSubject } = await import('../models/StaffSubject.js')

    // Subject assignments: one per staff
    const assignments = [
      { staffEmail: 'staff1@college.edu', code: '23CSP101', name: 'Programming Fundamentals', section: 'I CSE A' },
      { staffEmail: 'staff2@college.edu', code: '23CST102', name: 'Data Structures', section: 'I CSE A' },
      { staffEmail: 'staff3@college.edu', code: '23CSL103', name: 'Programming Lab', section: 'I CSE A' },
      { staffEmail: 'staff4@college.edu', code: '23MAT104', name: 'Mathematics I', section: 'I CSE A' },
      { staffEmail: 'staff5@college.edu', code: '23ENG105', name: 'English Communication', section: 'I CSE A' }
    ]

    for (const assign of assignments) {
      const staff = await User.findOne({ where: { email: assign.staffEmail } })
      if (!staff) {
        console.log(`Staff not found: ${assign.staffEmail}`)
        continue
      }

      // Find or create subject
      let subject = await Subject.findOne({ where: { code: assign.code } })
      if (!subject) {
        subject = await Subject.create({
          id: randomUUID(),
          code: assign.code,
          name: assign.name,
          section: assign.section
        })
        console.log(`Created subject: ${assign.code} - ${assign.name}`)
      } else {
        // Update name if different
        if (subject.name !== assign.name) {
          subject.name = assign.name
          await subject.save()
          console.log(`Updated subject: ${assign.code} - ${assign.name}`)
        }
      }

      // Remove existing assignments for this staff
      await StaffSubject.destroy({ where: { staffId: staff.id } })

      // Create new assignment
      const existing = await StaffSubject.findOne({ where: { staffId: staff.id, subjectId: subject.id } })
      if (!existing) {
        await StaffSubject.create({
          id: randomUUID(),
          staffId: staff.id,
          subjectId: subject.id
        })
        console.log(`Assigned ${assign.code} to ${staff.email}`)
      }
    }

    await sequelize.close()
    process.exit(0)
  } catch (err: any) {
    console.error('Failed to assign staff subjects:', err?.message || err)
    process.exit(1)
  }
}

main()

