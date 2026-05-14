import 'dotenv/config'
import { initSequelize, sequelize } from '../database/index.js'

async function main() {
  await initSequelize()
  const { StaffSubject } = await import('../models/StaffSubject.js')
  const { Subject } = await import('../models/Subject.js')

  const staffId = process.argv[2]
  if (!staffId) {
    console.error('Usage: npm run list-staff-subjects <staffId>')
    process.exit(1)
  }

  const assignments = await StaffSubject.findAll({ where: { staffId } })
  console.log(`Assignments for ${staffId}: ${assignments.length}`)
  for (const assign of assignments as any[]) {
    const subject = await Subject.findByPk(assign.subjectId)
    console.log(`- ${assign.subjectId} ${subject?.code} ${subject?.name}`)
  }

  await sequelize.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})


