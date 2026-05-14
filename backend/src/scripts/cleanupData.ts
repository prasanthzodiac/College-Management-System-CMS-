import 'dotenv/config'
import { initSequelize, sequelize } from '../database/index.js'
import { Op } from 'sequelize'

async function main() {
  await initSequelize()
  await sequelize.sync()

  const { Subject } = await import('../models/Subject.js')
  const { AttendanceSession, AttendanceEntry } = await import('../models/Attendance.js')

  // Targets provided by user
  const subjectCodesToRemove = ['STAFF101', 'STAFF102']
  // Dates to purge attendance (YYYY-MM-DD)
  const datesToRemove = ['2025-04-07', '2025-04-08', '2025-04-09', '2025-04-10', '2025-04-11']

  // 1) Remove attendance sessions by specific dates (any subject)
  const dateSessions = await AttendanceSession.findAll({ where: { date: { [Op.in]: datesToRemove } } })
  if (dateSessions.length) {
    const sessionIds = dateSessions.map((s: any) => s.id)
    await AttendanceEntry.destroy({ where: { sessionId: { [Op.in]: sessionIds } } })
    await AttendanceSession.destroy({ where: { id: { [Op.in]: sessionIds } } })
    console.log(`Removed ${sessionIds.length} attendance sessions and related entries for specified dates.`)
  } else {
    console.log('No attendance sessions found for specified dates.')
  }

  // 2) Remove subjects by code and all their attendance sessions/entries
  const subjects = await Subject.findAll({ where: { code: { [Op.in]: subjectCodesToRemove } } })
  if (subjects.length) {
    for (const subject of subjects as any[]) {
      const sessions = await AttendanceSession.findAll({ where: { subjectId: subject.id } })
      const sids = sessions.map((s: any) => s.id)
      if (sids.length) {
        await AttendanceEntry.destroy({ where: { sessionId: { [Op.in]: sids } } })
        await AttendanceSession.destroy({ where: { id: { [Op.in]: sids } } })
      }
      await subject.destroy()
      console.log(`Removed subject ${subject.code} and ${sids.length} sessions with entries.`)
    }
  } else {
    console.log('No subjects found matching codes to remove.')
  }

  await sequelize.close()
}

main().catch((err) => {
  console.error('Cleanup failed:', err)
  process.exit(1)
})


