import 'dotenv/config'
import { initSequelize, sequelize } from '../database/index.js'

async function main() {
  await initSequelize()
  const { StaffSubject } = await import('../models/StaffSubject.js')
  const { Subject } = await import('../models/Subject.js')

  const staffId = 'demo-token-staff@college.edu'
  const keepCodes = ['23CSP101', 'FREE001', 'LIB001', 'ONL001']

  await StaffSubject.destroy({ where: { staffId } })

  for (const code of keepCodes) {
    const subject = await Subject.findOne({ where: { code } })
    if (!subject) continue
    const { randomUUID } = await import('crypto')
    await StaffSubject.create({ id: randomUUID(), staffId, subjectId: subject.id })
  }

  console.log('Reset demo staff subjects to personal + shared')
  await sequelize.close()
}

main().catch((err) => {
  console.error('Failed to reset demo staff subjects:', err)
  process.exit(1)
})


